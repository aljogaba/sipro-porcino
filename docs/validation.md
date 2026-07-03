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

## Ciclo reproductivo

El cálculo de partos/hembra/año usa el ciclo reproductivo expresado en semanas:

```text
ciclo_reproductivo_semanas = (115 días de gestación + días de lactancia + días abiertos) / 7
partos_hembra_año = 52 / ciclo_reproductivo_semanas
```

En la versión inicial, los días abiertos estaban fijos en 7 días. Desde `0.1.2-dev`, se incorporan como entrada editable para permitir ajustes finos del intervalo posdestete-servicio.

## Nota técnica

El porcentaje de fertilidad aparece como entrada visible en el tablero, pero en la auditoría inicial no se detectó dependencia directa en las fórmulas productivas visibles del Excel fuente. Se conserva en el JSON y en la interfaz para revisión técnica posterior.

## Observación pendiente

Existe una discrepancia a revisar entre el ingreso bruto mensual mostrado por SIPRO-Porcino y el ingreso mensual del Excel fuente. No se corrige en esta actualización para no mezclar cambios de fórmula; queda registrado para validación específica del bloque económico.
