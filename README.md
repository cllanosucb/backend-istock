# iStock — Backend (API REST)

API REST para el sistema de gestión de inventario y ventas de iPhones de medio uso.
Node.js + Express + PostgreSQL (driver `pg`, sin ORM) + autenticación con JWT.

## Requisitos previos

- Node.js 18 o superior
- PostgreSQL instalado y corriendo localmente

## 1. Instalación

```bash
git clone https://github.com/cllanosucb/backend-istock.git
cd backend-istock
npm install
```

## 2. Configuración de la base de datos

Crear la base de datos:

- Ingresar a PGAdmin
- Crear una nueva base de datos con el nombre `istock`
- Restaurar base de datos con el archivo `db-istock`

## 3. Variables de entorno

Modificar las variables de entorno en el archivo `.env`:
- Modificar el usuario y la contraseña de la base de datos
```
DATABASE_URL=postgresql://usuario:password@localhost:5432/istock
```
- Tambien se puede modificar el puerto y la url del frontend

```
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

> `CORS_ORIGIN` debe apuntar a la URL donde corra el frontend en React.

## 4. Datos de acceso

Los datos de acceso son:
- Usuario: `admin@istock.com` 
- Contraseña: `admin123`

## 5. Ejecutar el servidor

```bash
npm run dev     # con nodemon, recarga automática
# o
npm start       # modo normal
```

El servidor queda escuchando en `http://localhost:4000`. Verificar con:

```bash
curl http://localhost:4000/api/health
```

## 6. Endpoints disponibles

### Autenticación (públicos)

| Método | Ruta                  | Descripción                        |
|--------|-----------------------|-------------------------------------|
| POST   | `/api/auth/login`     | Devuelve un JWT si las credenciales son correctas |

El resto de las rutas requieren el header:
```
Authorization: Bearer <token>
```

### Equipos (inventario)

| Método | Ruta                       | Descripción                                  |
|--------|----------------------------|-----------------------------------------------|
| GET    | `/api/equipos`             | Lista todos los equipos                       |
| GET    | `/api/equipos/disponibles` | Lista solo los equipos con estado "disponible" (usado por el formulario de ventas) |
| GET    | `/api/equipos/:id`         | Obtiene un equipo por id                      |
| POST   | `/api/equipos`             | Crea un nuevo equipo                          |
| PUT    | `/api/equipos/:id`         | Actualiza un equipo                           |
| DELETE | `/api/equipos/:id`         | Elimina un equipo                             |

### Ventas

| Método | Ruta                | Descripción                                                                 |
|--------|---------------------|-------------------------------------------------------------------------------|
| GET    | `/api/ventas`       | Lista todas las ventas (con datos del equipo vendido)                        |
| GET    | `/api/ventas/:id`   | Obtiene una venta por id                                                     |
| POST   | `/api/ventas`       | Crea una venta. El equipo pasa automáticamente a estado "vendido"           |
| PUT    | `/api/ventas/:id`   | Actualiza una venta. Si se cambia el equipo, revierte el anterior a "disponible" |
| DELETE | `/api/ventas/:id`   | Elimina una venta. El equipo vuelve a estado "disponible"                    |
| GET | `/api/dashboard/resumen`   | Metricas que muestran un resumen de ventas"                    |

## 7. Ejemplo de flujo con curl

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@istock.com","password":"admin123"}' | jq -r .token)

# Listar equipos
curl -s http://localhost:4000/api/equipos -H "Authorization: Bearer $TOKEN"

# Registrar una venta
curl -s -X POST http://localhost:4000/api/ventas \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"equipo_id":2,"fecha_venta":"2026-09-05","cliente":"Juan Perez","precio_final":410,"metodo_pago":"efectivo","garantia":"1_mes"}'
```

## 8. Estructura del proyecto

```
istock-backend/
├── src/
│   ├── app.js                 # configuración de Express, CORS, rutas
│   ├── server.js               # arranque del servidor
│   ├── config/db.js            # pool de conexión a PostgreSQL
│   ├── controllers/            # lógica de negocio (auth, equipos, ventas)
│   ├── routes/                 # definición de rutas REST
│   ├── middleware/              # verificación de JWT y manejo de errores
├── .env.example
└── package.json
```
