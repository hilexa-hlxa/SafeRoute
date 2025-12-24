from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.incident import Incident
from app.core.auth_deps import get_current_user
from app.models.user import User
from app.routers.incidents import haversine_distance
import httpx
import math

router = APIRouter(prefix="/routes", tags=["routes"])


class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    avoid_radius: Optional[float] = 100  # радиус избегания в метрах


class RouteResponse(BaseModel):
    distance: float  # в метрах
    duration: float  # в секундах
    geometry: List[List[float]]  # координаты маршрута [[lat, lng], ...]
    waypoints: List[dict]


def create_avoid_polygon(lat: float, lng: float, radius_meters: float, points: int = 8) -> List[List[float]]:
    """Создает полигон (круг) вокруг точки для избегания"""
    import math
    
    R = 6371000  # радиус Земли в метрах
    polygon = []
    
    for i in range(points):
        angle = 2 * math.pi * i / points
        # Смещение в метрах
        dlat = (radius_meters / R) * math.cos(angle)
        dlng = (radius_meters / (R * math.cos(math.radians(lat)))) * math.sin(angle)
        
        new_lat = lat + math.degrees(dlat)
        new_lng = lng + math.degrees(dlng)
        polygon.append([new_lat, new_lng])
    
    # Замкнуть полигон
    polygon.append(polygon[0])
    return polygon


@router.post("/safe-route", response_model=dict)
async def get_safe_route(
    route_data: RouteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Получить безопасный маршрут, обходящий инциденты
    
    Использует GraphHopper API (бесплатный, до 500 запросов/день)
    Для production рекомендуется использовать OSRM
    """
    
    # 1. Получить все активные инциденты в области между точками
    # Простая проверка: инциденты в прямоугольнике между start и end
    min_lat = min(route_data.start_lat, route_data.end_lat) - 0.01
    max_lat = max(route_data.start_lat, route_data.end_lat) + 0.01
    min_lng = min(route_data.start_lng, route_data.end_lng) - 0.01
    max_lng = max(route_data.start_lng, route_data.end_lng) + 0.01
    
    result = await db.execute(
        select(Incident).where(
            Incident.status.in_(["active", "pending"]),
            Incident.lat >= min_lat,
            Incident.lat <= max_lat,
            Incident.lng >= min_lng,
            Incident.lng <= max_lng
        )
    )
    incidents = result.scalars().all()
    
    # 2. Создать промежуточные точки, обходящие инциденты
    # Стратегия: если есть инциденты на прямой линии, добавляем обходные точки
    waypoints = []
    
    if incidents:
        # Вычисляем базовое направление от start к end
        base_bearing = math.atan2(
            route_data.end_lng - route_data.start_lng,
            route_data.end_lat - route_data.start_lat
        )
        
        # Для каждого инцидента, который близко к прямой линии, добавляем обходную точку
        for incident in incidents:
            # Проверяем, находится ли инцидент близко к прямой линии маршрута
            distance_to_line = haversine_distance(
                route_data.start_lat, route_data.start_lng,
                incident.lat, incident.lng
            )
            
            # Если инцидент в радиусе избегания от прямой линии
            if distance_to_line < route_data.avoid_radius * 2:
                # Создаем обходную точку, смещенную перпендикулярно к маршруту
                perp_bearing = base_bearing + math.pi / 2  # Перпендикуляр
                offset_distance = route_data.avoid_radius * 1.5  # Смещение
                
                R = 6371000  # радиус Земли
                dlat = (offset_distance / R) * math.cos(perp_bearing)
                dlng = (offset_distance / (R * math.cos(math.radians(incident.lat)))) * math.sin(perp_bearing)
                
                avoid_point_lat = incident.lat + math.degrees(dlat)
                avoid_point_lng = incident.lng + math.degrees(dlng)
                
                waypoints.append({
                    "lat": avoid_point_lat,
                    "lng": avoid_point_lng,
                    "type": "avoid"
                })
    
    # 3. Запросить маршрут через GraphHopper API
    # GraphHopper не поддерживает avoid_polygons, поэтому используем промежуточные точки
    try:
        async with httpx.AsyncClient() as client:
            url = "https://graphhopper.com/api/1/route"
            
            # Строим список точек маршрута: start -> обходные точки -> end
            route_points = [
                [route_data.start_lng, route_data.start_lat]  # [lng, lat] для GraphHopper
            ]
            
            # Добавляем обходные точки (сортируем по расстоянию от start)
            if waypoints:
                waypoints_sorted = sorted(
                    waypoints,
                    key=lambda w: haversine_distance(
                        route_data.start_lat, route_data.start_lng,
                        w["lat"], w["lng"]
                    )
                )
                for wp in waypoints_sorted:
                    route_points.append([wp["lng"], wp["lat"]])
            
            route_points.append([route_data.end_lng, route_data.end_lat])
            
            # GraphHopper API через GET с множественными point параметрами
            query_params = [("key", "c8c31437-d103-49d9-ac34-0e7594374491")]
            for point in route_points:
                query_params.append(("point", f"{point[1]},{point[0]}"))  # lat,lng
            
            query_params.extend([
                ("vehicle", "foot"),
                ("instructions", "false"),
                ("points_encoded", "false"),
                ("type", "json")
            ])
            
            response = await client.get(url, params=query_params, timeout=15.0)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"Routing service error: {response.text}"
                )
            
            data = response.json()
            
            if "paths" not in data or len(data["paths"]) == 0:
                raise HTTPException(
                    status_code=404,
                    detail="No route found"
                )
            
            path = data["paths"][0]
            
            # Преобразовать в нужный формат
            geometry = []
            
            # GraphHopper может возвращать координаты в разных форматах
            if "points" in path:
                points_data = path["points"]
                if isinstance(points_data, dict) and "coordinates" in points_data:
                    # Формат: {"type": "LineString", "coordinates": [[lng, lat], ...]}
                    for point in points_data["coordinates"]:
                        geometry.append([point[1], point[0]])  # [lat, lng]
                elif isinstance(points_data, list):
                    # Прямой список координат
                    for point in points_data:
                        if isinstance(point, list) and len(point) >= 2:
                            geometry.append([point[1], point[0]])  # [lat, lng]
            
            # Если points_encoded=False, координаты могут быть в другом формате
            if not geometry and "snapped_waypoints" in path:
                snapped = path["snapped_waypoints"]
                if isinstance(snapped, dict) and "coordinates" in snapped:
                    for point in snapped["coordinates"]:
                        geometry.append([point[1], point[0]])  # [lat, lng]
            
            # Если все еще нет геометрии, используем waypoints
            if not geometry:
                geometry = [
                    [route_data.start_lat, route_data.start_lng],
                    [route_data.end_lat, route_data.end_lng]
                ]
            
            return {
                "distance": path.get("distance", 0) / 1000,  # в км
                "duration": path.get("time", 0) / 1000,  # в секундах
                "geometry": geometry,
                "waypoints": [
                    {"lat": route_data.start_lat, "lng": route_data.start_lng, "type": "start"},
                    *[{"lat": wp["lat"], "lng": wp["lng"], "type": "avoid"} for wp in waypoints],
                    {"lat": route_data.end_lat, "lng": route_data.end_lng, "type": "end"}
                ],
                "incidents_avoided": len(incidents),
                "avoidance_points": len(waypoints)
            }
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Routing service unavailable: {str(e)}"
        )


@router.get("/alternatives")
async def get_route_alternatives(
    start_lat: float = Query(...),
    start_lng: float = Query(...),
    end_lat: float = Query(...),
    end_lng: float = Query(...),
    alternatives: int = Query(3, ge=1, le=5),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Получить несколько альтернативных маршрутов
    """
    # Аналогично safe-route, но запрашиваем несколько вариантов
    # Это можно реализовать через GraphHopper с параметром alternatives
    pass

