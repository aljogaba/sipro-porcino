# Validación inicial

## Caso base auditado desde Excel fuente

Con los parámetros iniciales del archivo `data/default-parameters.json`, el módulo de inventarios debe aproximar los siguientes resultados del tablero original. La comparación exacta puede variar ligeramente porque desde `0.1.2-dev` se actualizó el parámetro técnico de gestación de 114 a 115 días.

| Indicador | Valor esperado en Excel fuente original |
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

## Módulo de alimento

Desde `0.2.0-dev` se incorpora el cálculo inicial de consumo y costo de alimento por etapa.

La estructura general es:

```text
kg_alimento_semana = inventario_alimentado × consumo_kg_día × 7
costo_alimento_semana = kg_alimento_semana × costo_kg_alimento
costo_alimento_mes = costo_alimento_semana × 4.3
```

El pie de cría incluye:

```text
hembras gestantes = vientres - hembras lactantes
hembras lactantes = partos_semana × semanas_lactancia
machos = vientres / 20
```

La gestación suma hembras gestantes + machos, siguiendo la estructura auditada del Excel fuente.

## Nota técnica

El porcentaje de fertilidad aparece como entrada visible en el tablero, pero en la auditoría inicial no se detectó dependencia directa en las fórmulas productivas visibles del Excel fuente. Se conserva en el JSON y en la interfaz para revisión técnica posterior.

## Observación pendiente

El ingreso bruto mensual del Excel fuente incluye ingresos adicionales por desecho/pie de cría. En SIPRO-Porcino, el KPI actual de ingreso bruto mensual corresponde al ingreso por cerdos a rastro. El módulo económico completo deberá separar ambos conceptos para evitar confusión:

- ingreso por cerdos a rastro;
- ingreso por desecho/pie de cría;
- ingreso total mensual.


## Ajuste v0.2.1: modo de costo de alimento

Se agregó un selector de modo para distinguir dos escenarios técnicos:

1. **Dietas compradas:** el usuario captura directamente el costo por kg de cada dieta.
2. **Formulación propia:** la plataforma usará costos calculados desde formulaciones. En esta versión queda preparada la arquitectura y se utilizan costos de referencia derivados del Excel fuente.

El modo activo afecta directamente el costo semanal, mensual, costo alimento/kg y conversión económica asociada al alimento.

## Versión 0.3.0-dev — Resumen económico mensual

Se agregó un módulo inicial de resumen económico. Esta versión integra:

- ingresos mensuales calculados a partir de cerdos vendidos, peso de venta y precio por kg;
- costo mensual de alimento calculado desde el módulo de alimento;
- mano de obra calculada como trabajadores × salario semanal × 4.3 semanas/mes;
- costos mensuales editables para medicina/impuestos/varios, gastos extras y egresos de pie de cría;
- egresos totales, utilidad mensual, utilidad semanal y porcentajes sobre ingreso.

Los valores de medicina, impuestos, gastos extras y pie de cría quedan como entradas provisionales hasta migrar los módulos detallados del Excel fuente.

Validación pendiente:

- comparar ingresos mensuales contra el Excel, considerando el ajuste de gestación de 115 días;
- validar si el Excel usa 4.3 semanas/mes en todos los bloques económicos;
- confirmar la lógica detallada de pie de cría y gastos médicos desde las hojas auxiliares.


## Versión 0.4.0-dev — Análisis de escenarios

Se agregó una capa inicial de análisis de escenarios. Los escenarios son proyecciones paralelas basadas en los parámetros capturados en el tablero y no modifican el escenario actual.

Escenarios incluidos:

- **Escenario actual:** resultados con los valores capturados por el usuario.
- **Mejora técnica:** incremento de 0.5 LNV/hembra, reducción de mortalidad en maternidad, destete y finalización, y reducción de 3% en costo de alimento.
- **Presión sanitaria:** incremento moderado de mortalidad en maternidad, destete, iniciación y finalización.
- **Alimento +10%:** incremento de 10% en el costo de todas las dietas activas.
- **Mercado adverso:** reducción de 5% en precio de venta y aumento de 5% en costo de alimento.

Validación pendiente:

- convertir estos escenarios en configuraciones editables por el usuario;
- permitir guardar o exportar comparación de escenarios;
- definir escenarios técnicos estandarizados para distintos perfiles de granja.


## Ajuste de presentación v0.4.1-dev

- El bloque principal de indicadores se reorganizó para mostrar únicamente resultados productivos y técnicos.
- Se agregó el indicador `Lechones destetados/hembra/año`, derivado de `Lechones destetados/camada × Partos/hembra/año`.
- Los indicadores económicos principales se trasladaron a un panel lateral persistente de balance mensual, mientras que el resumen económico detallado permanece en su sección específica.


## Ajuste v0.4.2-dev: inventario de hembras y balance lateral

Se separó la lectura visual del inventario en dos componentes:

- **Cerdos en producción:** lactantes, destete y finalización.
- **Hembras reproductivas:** hembras lactando, hembras abiertas y hembras gestantes.

La lógica usada para hembras reproductivas es:

```text
Hembras lactando = partos/semana × semanas de lactancia
Hembras abiertas = partos/semana × días abiertos / 7
Hembras gestantes = vientres - hembras lactando - hembras abiertas
```

Este inventario se muestra como lectura operativa del sistema reproductivo y no se suma al inventario total de cerdos en producción del tablero principal.

También se ajustó el layout responsivo del balance económico lateral para evitar superposición con los paneles principales.


## v0.5.0-dev — Formulación económica de dietas

Se integra el primer módulo de formulación alimenticia con enfoque económico, no nutricional.

### Alcance

- Ingredientes editables: sorgo, maíz, soya, salvado, sebo y cinco ingredientes opcionales.
- Núcleos/dietas completas editables por etapa.
- Fórmulas por tonelada con kg de inclusión por ingrediente y núcleo.
- Cálculo automático de total kg, costo/ton y costo/kg por dieta.
- Advertencia visual cuando una dieta no suma 1000 kg.
- Balance mensual de insumos ligado al consumo mensual estimado por dieta.
- Transferencia automática de costos formulados al modo “Formulación propia”.

### Exclusiones técnicas de esta versión

- No calcula proteína, energía, lisina, minerales ni restricciones nutricionales.
- La medicación/suplementación no ponderal no se suma todavía al costo formulado; queda reservada para el módulo posterior de medicación/premezclas.
- Fase 0 y Fase 1 se tratan como dietas completas compradas dentro del bloque de núcleos.


## Ajuste de modo de alimentación `v0.5.1-dev`

El módulo de formulación alimenticia se muestra únicamente cuando el usuario selecciona `Formulación propia`. En modo `Dietas compradas`, la interfaz conserva solo la captura directa del costo por kg de dieta, reduciendo duplicidad visual y evitando que el usuario capture datos de formulación cuando no aplican.
