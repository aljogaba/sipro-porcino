# Validación inicial

## Caso base auditado desde Excel fuente

Con los parámetros iniciales del archivo `data/default-parameters.json`, el módulo de inventarios debe aproximar los siguientes resultados del tablero original:

| Indicador | Valor esperado |
|---|---:|
| Cerdos vendidos/mes | 492.79 |
| Días a mercado | 163 |
| Partos/hembra/año | 2.15 |
| Lechones destetados/camada | 9.82 |
| Lechones destetados/hembra/año | 21.11 |
| Cerdos vendidos/hembra/año | 19.62 |
| Inventario total | 2869.9 |
| Inventario promedio/hembra | 9.57 |
| Factor de eficiencia | 1.64 |

## Nota técnica

El porcentaje de fertilidad aparece como entrada visible en el tablero, pero en la auditoría inicial no se detectó dependencia directa en las fórmulas productivas visibles del Excel fuente. Se conserva en el JSON y en la interfaz para revisión técnica posterior.
