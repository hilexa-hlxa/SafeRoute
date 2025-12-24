# Реализация маршрута, обходящего опасные места

## Оценка сложности: **Средняя** (3-5 дней разработки)

## Варианты реализации:

### Вариант 1: OSRM (Open Source Routing Machine) - Рекомендуется ⭐
**Сложность:** Средняя
**Стоимость:** Бесплатно
**Преимущества:**
- Полностью бесплатный
- Работает локально (приватность данных)
- Быстрый
- Поддерживает избегание зон

**Недостатки:**
- Требует настройки сервера OSRM
- Нужны данные OpenStreetMap (большой файл)

**Реализация:**
1. Установить OSRM сервер (Docker)
2. Загрузить карту региона
3. Использовать API для построения маршрута с avoid_polygons

### Вариант 2: GraphHopper API
**Сложность:** Низкая-Средняя
**Стоимость:** Бесплатно (до 500 запросов/день)
**Преимущества:**
- Готовый API
- Простая интеграция
- Поддержка избегания зон

**Недостатки:**
- Лимит на бесплатный план
- Требует интернет

### Вариант 3: Google Maps Directions API
**Сложность:** Низкая
**Стоимость:** Платно ($5 за 1000 запросов)
**Преимущества:**
- Очень точные маршруты
- Простая интеграция
- Отличная документация

**Недостатки:**
- Платно
- Требует API ключ

### Вариант 4: Собственный алгоритм (A* с модификацией)
**Сложность:** Высокая
**Стоимость:** Бесплатно
**Преимущества:**
- Полный контроль
- Не зависит от внешних сервисов

**Недостатки:**
- Очень сложно реализовать
- Нужны данные о дорожной сети
- Медленнее готовых решений

## Рекомендуемый подход (OSRM):

### Шаг 1: Установка OSRM (Docker)
```bash
# Скачать карту региона (например, для Нью-Йорка)
docker run -t -v $(pwd):/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/new-york-latest.osm.pbf
docker run -t -v $(pwd):/data osrm/osrm-backend osrm-contract /data/new-york-latest.osrm
docker run -t -i -p 5000:5000 -v $(pwd):/data osrm/osrm-backend osrm-routed --algorithm mld /data/new-york-latest.osrm
```

### Шаг 2: Backend API endpoint
```python
@router.post("/route")
async def get_safe_route(
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
    avoid_radius: float = 100,  # радиус избегания в метрах
    db: AsyncSession = Depends(get_db)
):
    # 1. Получить все активные инциденты
    # 2. Создать полигоны избегания вокруг каждого инцидента
    # 3. Запросить маршрут через OSRM с avoid_polygons
    # 4. Вернуть маршрут
```

### Шаг 3: Frontend компонент
- Кнопка "Safe Route"
- Ввод начальной и конечной точки
- Отображение маршрута на карте
- Показ альтернативных маршрутов

## Что нужно для реализации:

1. **Backend:**
   - Новый endpoint `/route` или `/routes/safe`
   - Интеграция с OSRM API
   - Логика создания полигонов избегания
   - Кэширование маршрутов

2. **Frontend:**
   - UI для выбора точек маршрута
   - Отображение маршрута на карте (React-Leaflet Routing Machine)
   - Кнопка "Find Safe Route"

3. **Инфраструктура:**
   - OSRM сервер (можно в Docker)
   - Данные карты региона

## Примерная структура кода:

```python
# backend/app/routers/routes.py
@router.post("/safe-route")
async def get_safe_route(
    route_data: RouteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Получить инциденты в области маршрута
    incidents = await get_incidents_in_area(...)
    
    # Создать полигоны избегания (круги вокруг инцидентов)
    avoid_polygons = create_avoid_polygons(incidents, radius=100)
    
    # Запросить маршрут через OSRM
    route = await osrm_route(
        start=[route_data.start_lat, route_data.start_lng],
        end=[route_data.end_lat, route_data.end_lng],
        avoid_polygons=avoid_polygons
    )
    
    return route
```

## Время реализации:
- **Простой вариант (GraphHopper API):** 1-2 дня
- **OSRM (локальный):** 3-4 дня
- **Собственный алгоритм:** 1-2 недели

## Рекомендация:
Начать с **GraphHopper API** для быстрого прототипа, затем перейти на **OSRM** для production.


