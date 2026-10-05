# Descripción técnica del modelo SIPRO-Porcino

Versión documentada: `v1.2.4-dev`

Este documento describe la lógica técnica implementada en el código. No es un manual de usuario y no sustituye `docs/validation.md`.

## 1. Arquitectura general

El flujo lógico actual puede resumirse como:

```text
Entradas y parámetros
→ flujo reproductivo y productivo
→ inventarios
→ alimentación
→ formulación económica / costos de dieta
→ costos operativos
→ pie de cría
→ ingresos y resultados económicos
→ escenarios
→ sensibilidad y visualizaciones
→ auditoría y reporte
```

Los parámetros iniciales se cargan desde `data/default-parameters.json`. La interfaz conserva una copia base y una copia editable en memoria. Los cálculos se ejecutan en el navegador y se recalculan al cambiar entradas.

## 2. Entradas

Las entradas se organizan en:

- parámetros productivos;
- duración de etapas;
- consumo de alimento;
- costos de dietas compradas;
- formulación económica propia;
- medicación/premezclas;
- mano de obra;
- gastos extras;
- gastos sanitarios, impuestos y servicios;
- pie de cría, reemplazos y desechos.

Los valores base, unidades y fuentes históricas del Excel se conservan en `data/default-parameters.json` cuando están disponibles.

## 3. Módulo de flujo reproductivo y productivo

Archivo principal: `js/modules/reproductive-flow.js`.

### Entradas principales

- número de vientres;
- porcentaje de paridad;
- porcentaje de fertilidad;
- días de gestación;
- días de lactancia;
- días abiertos;
- LNV/hembra;
- mortalidades por etapa;
- duración de etapas;
- peso de mercado;
- precio de venta/kg.

### Cálculo reproductivo

```text
semanas_lactancia = días_lactancia / 7
ciclo_semanas = (días_gestación + días_lactancia + días_abiertos) / 7
vientres_servidos_semana = vientres / ciclo_semanas
partos_semana = vientres_servidos_semana × paridad
nacidos_vivos_semana = partos_semana × LNV_hembra
```

`paridad` se convierte de porcentaje a proporción.

La fertilidad se lee y se conserva dentro de los supuestos devueltos por el módulo, pero no participa directamente en el cálculo actual.

### Flujo por supervivencia

Cada etapa aplica la supervivencia correspondiente sobre la salida de la etapa previa:

```text
salida_etapa = entrada_etapa × (1 - mortalidad_etapa)
```

Secuencia actual:

```text
nacidos vivos
→ supervivencia maternidad
→ supervivencia destete
→ supervivencia iniciación
→ supervivencia crecimiento
→ supervivencia desarrollo
→ supervivencia finalización
→ cerdos a mercado
```

### Ventas y producción mensual

```text
cerdos_vendidos_mes = cerdos_mercado_semana × 4.3
kg_mercado_mes = cerdos_vendidos_mes × peso_mercado
ingreso_rastro_original = kg_mercado_mes × precio_venta_kg
```

### Indicadores anuales

```text
partos_hembra_año = (partos_semana × 52) / vientres
lechones_destetados_hembra_año = lechones_destetados_camada × partos_hembra_año
```

Para `cerdos vendidos/hembra/año` se conserva una fórmula auditada del Excel fuente:

```text
mortalidad_global = suma de porcentajes de mortalidad por etapa
supervivencia_global = (100 - mortalidad_global) / 100
cerdos_vendidos_hembra_año = LNV_hembra × supervivencia_global × partos_hembra_año
```

Esta fórmula no es idéntica a encadenar supervivencias multiplicativas. La diferencia está documentada como pendiente de validación.

### Días a mercado

```text
semanas_producción = semanas_lactancia
                    + fase_1 + fase_2 + fase_3
                    + iniciación + crecimiento + desarrollo + finalización

días_mercado = semanas_producción × 7
```

### Salidas

- flujo semanal por etapa;
- cerdos vendidos/mes;
- kg vendidos/mes;
- ingreso bruto original por rastro;
- partos/hembra/año;
- lechones destetados/camada;
- lechones destetados/hembra/año;
- cerdos vendidos/hembra/año;
- mortalidad global y supervivencia global;
- días a mercado.

## 4. Módulo de inventarios

Archivo principal: `js/modules/inventory.js`.

Depende del flujo reproductivo/productivo.

### Inventario productivo

```text
lactantes = nacidos_vivos_semana × semanas_lactancia
```

El bloque `destete` agrega:

```text
(destetados_semana × semanas_fase_1)
+ (destetados_semana × semanas_fase_2)
+ (destetados_semana × semanas_fase_3)
+ (entrada_iniciación_semana × semanas_iniciación)
```

El bloque de crecimiento/finalización agrega:

```text
(entrada_crecimiento_semana × semanas_crecimiento)
+ (entrada_desarrollo_semana × semanas_desarrollo)
+ (entrada_finalización_semana × semanas_finalización)
```

```text
inventario_total = lactantes + destete + crecimiento_finalización
inventario_por_vientre = inventario_total / vientres
factor_eficiencia = cerdos_vendidos_mes / vientres
```

### Inventario reproductivo

Se presenta aparte del inventario productivo:

```text
hembras_lactando = partos_semana × semanas_lactancia
hembras_abiertas = partos_semana × días_abiertos / 7
hembras_gestantes = max(vientres - hembras_lactando - hembras_abiertas, 0)
```

### Reemplazos visibles

```text
reemplazos_mes = vientres × tasa_reemplazo_anual / 12
inventario_reemplazo = reemplazos_mes × meses_como_reemplazo
```

No se suman al inventario productivo principal.

## 5. Módulo de consumo y costo de alimento

Archivo principal: `js/modules/feed-consumption.js`.

Depende de inventarios y flujo.

### Selección del costo

El modelo usa uno de dos conjuntos de costos:

- `feed_costs_purchased_per_kg` para **Dietas compradas**;
- `feed_costs_formulated_per_kg` para **Formulación propia**.

### Inventario alimentado

El módulo construye una fila para cada dieta/etapa. La cantidad de animales depende del flujo y de la duración de la etapa.

Para pie de cría:

```text
machos_referencia = vientres / 20
hembras_lactando = partos_semana × semanas_lactancia
hembras_gestación_alimento = max(vientres - hembras_lactando, 0)
animales_dieta_gestación = hembras_gestación_alimento + machos_referencia
```

Esta definición alimenticia no resta hembras abiertas, a diferencia del inventario reproductivo mostrado. La diferencia se conserva como punto explícito de validación.

### Consumo y costo

Por fila:

```text
kg_semana = animales × kg_día × 7
kg_mes = kg_semana × 4.3
costo_semana = kg_semana × costo_kg
costo_mes = costo_semana × 4.3
```

Totales:

```text
costo_promedio_alimento_kg = costo_total_mes / kg_total_mes
conversión_alimenticia_granja = kg_total_mes / kg_cerdo_vendido_mes
```

### Salidas

- kg/semana y kg/mes por dieta;
- costo semanal y mensual por dieta;
- costo total de alimento;
- costo promedio/kg;
- conversión alimenticia de granja;
- costo agrupado por segmentos productivos.

## 6. Módulo de formulación económica

Archivo principal: `js/modules/feed-formulation.js`.

### Propósito

Calcular el costo económico de una tonelada de dieta. **No realiza formulación nutricional**.

### Entradas

- ingredientes y precios/kg;
- inclusión de ingredientes en kg/ton;
- núcleo o dieta completa por etapa;
- inclusión de núcleo en kg/ton;
- costos no ponderales manuales;
- medicación/premezclas;
- consumo mensual de cada dieta.

### Costo por dieta

```text
costo_ingrediente = kg_ingrediente × precio_kg
costo_núcleo = kg_núcleo × precio_núcleo

kg_ponderales = suma(kg_ingredientes) + kg_núcleo
costo_ton = suma(costo_ingredientes)
            + costo_núcleo
            + costo_no_ponderal_manual
            + costo_medicación

costo_kg = costo_ton / tamaño_lote
```

El tamaño base de lote es `1,000 kg`.

Una dieta se considera balanceada en peso si:

```text
abs(kg_ponderales - 1000) <= 0.01
```

Fase 0 y Fase 1 se modelan como dieta completa dentro del componente de núcleo, con 1,000 kg.

### Balance mensual de insumos

El consumo mensual de cada ingrediente/núcleo se escala según la proporción usada por tonelada y los kg mensuales de dieta calculados por el módulo de alimento.

## 7. Medicación y premezclas

Implementado dentro de `js/modules/feed-formulation.js` y configurado en `data/default-parameters.json`.

### Regla

Para cada producto y dieta:

```text
costo_producto_ton = inclusión_kg_ton × precio_kg
kg_producto_mes = (inclusión_kg_ton / 1000) × kg_dieta_mes
costo_producto_mes = kg_producto_mes × precio_kg
```

La suma de estos costos se agrega al costo formulado por tonelada, pero **no** a los kg usados para cerrar la fórmula a 1,000 kg.

Fase 0 y Fase 1 quedan fuera de la matriz actual de medicación/premezclas.

## 8. Gastos sanitarios, impuestos y servicios

Archivo principal: `js/modules/operational-expenses.js`.

Para cada fila:

```text
importe = cantidad × costo_unitario
```

El total de categoría es la suma de sus filas y el total mensual es la suma de categorías.

Cuando el módulo está habilitado, su total sustituye el valor agregado heredado de `Medicina, impuestos y varios` en el resumen económico.

## 9. Pie de cría, reemplazos y desechos

Archivo principal: `js/modules/breeding-stock.js`.

### Reemplazo de hembras

```text
reemplazos_mes = vientres × (% reemplazo_anual / 100) / 12
desechos_mes = reemplazos_mes
inventario_reemplazo = reemplazos_mes × meses_como_reemplazo
```

### Costo de hembras

Autorreemplazo:

```text
costo_unitario = peso_reemplazo × costo_producción_kg
```

Compra externa:

```text
costo_unitario = precio_compra_hembra
```

```text
costo_reemplazos_mes = reemplazos_mes × costo_unitario
```

### Ingreso de desecho

```text
ingreso_desecho_mes = desechos_mes × peso_desecho × precio_desecho_kg
```

### Compra de machos

```text
machos_referencia = vientres / 20
machos_comprados_mes = machos_comprados_año / 12
costo_machos_mes = machos_comprados_mes × precio_macho
```

No se modela venta de machos de desecho.

### Ajuste por autorreemplazo

Cuando el modo es autorreemplazo, el modelo descuenta del ingreso a rastro el valor que habrían representado las hembras seleccionadas para reemplazo:

```text
ajuste_autorreemplazo = reemplazos_mes × peso_mercado × precio_venta_kg
```

El ajuste es económico y no modifica el flujo productivo ni sus KPIs.

## 10. Resumen económico

Archivo principal: `js/modules/economic-summary.js`.

Depende de alimento, gastos operativos y pie de cría.

### Ingresos

```text
ingreso_rastro_ajustado = max(ingreso_rastro_original - ajuste_autorreemplazo, 0)
ingreso_total_mes = ingreso_rastro_ajustado + ingreso_desecho_mes
```

### Egresos

Incluye:

- alimento;
- mano de obra;
- medicina, impuestos y varios, obtenido del módulo detallado cuando está habilitado;
- gastos extras;
- egresos de pie de cría.

Mano de obra:

```text
mano_obra_mes = trabajadores × salario_semanal × 4.3
```

Resultados:

```text
egresos_totales_mes = suma(egresos)
utilidad_mes = ingreso_total_mes - egresos_totales_mes
utilidad_semana = utilidad_mes / 4.3
```

También se calculan porcentajes de costos y utilidad sobre ingresos.

## 11. Escenarios

Archivo principal: `js/modules/scenario-analysis.js`.

Cada escenario clona los parámetros actuales, modifica solo las variables definidas y recalcula alimento, gastos operativos, pie de cría y resumen económico.

Escenarios actuales:

| Escenario | Modificaciones |
|---|---|
| Actual | Sin modificación |
| Mejora técnica | LNV +0.5; mortalidad maternidad -2 pp; destete -1 pp; finalización -1 pp; alimento -3 % |
| Presión sanitaria | mortalidad maternidad +3 pp; destete +2 pp; iniciación +1 pp; finalización +2 pp |
| Alimento +10 % | costos de dietas activas +10 % |
| Mercado adverso | precio de venta -5 %; alimento +5 % |

Las salidas incluyen diferencias frente al escenario actual en producción, ingresos, costos y utilidad.

## 12. Sensibilidad

La sensibilidad se implementa en `js/app.js` como un conjunto de pruebas rápidas univariadas. Para cada prueba:

1. se clonan los parámetros actuales;
2. se modifica una variable según la prueba definida;
3. se recalcula la utilidad;
4. se calcula la diferencia contra la utilidad base;
5. los resultados se ordenan por magnitud absoluta del cambio.

El gráfico tipo tornado representa **impacto local de pruebas predeterminadas**, no un análisis probabilístico ni una estimación de incertidumbre.

## 13. Visualizaciones

La capa visual no modifica los resultados numéricos. Incluye:

- formación de la utilidad mensual tipo waterfall;
- composición de egresos;
- costo de alimento por etapa;
- gastos sanitarios y servicios;
- impacto de pie de cría y desechos;
- balance mensual de insumos;
- utilidad por escenario;
- sensibilidad de utilidad tipo tornado.

## 14. Auditoría del modelo

La interfaz integra una auditoría dinámica que resume consistencia y trazabilidad de módulos activos. Su función es señalar estados y posibles puntos de revisión; no modifica cálculos.

Entre los elementos revisados se encuentran:

- modo de alimento;
- cierre de formulaciones a 1,000 kg;
- medicación/premezclas;
- gastos operativos;
- pie de cría;
- ingresos y egresos;
- autorreemplazo.

## 15. Reporte técnico

El reporte se genera desde `js/app.js` con los valores activos del simulador.

Es un archivo HTML independiente y de un solo archivo, diseñado para:

- revisión técnica;
- impresión o guardado como PDF desde el navegador;
- envío o archivo de una simulación.

El reporte organiza resultados; no ejecuta una lógica de cálculo independiente del simulador.

## 16. Dependencias y trazabilidad entre módulos

```text
reproductive-flow
      ↓
inventory
      ↓
feed-consumption ← costos de dieta
      ↑
feed-formulation ← medication-premix

operational-expenses ─┐
breeding-stock ───────┼→ economic-summary
feed-consumption ─────┘

parámetros actuales → scenario-analysis → comparación de escenarios
parámetros actuales → pruebas de sensibilidad → gráfico tornado
resultados integrados → auditoría + visualizaciones + reporte
```

En modo `Formulación propia`, la aplicación calcula primero los costos formulados, sincroniza `feed_costs_formulated_per_kg` y vuelve a calcular el módulo de alimento con esos costos.

## 17. Estado técnico y puntos abiertos

### Implementado

- flujo productivo;
- inventarios;
- alimentación;
- costos de dietas compradas;
- formulación económica;
- medicación/premezclas;
- gastos operativos detallados;
- pie de cría;
- resumen económico;
- escenarios;
- sensibilidad rápida;
- visualizaciones;
- auditoría;
- reporte HTML.

### Pendiente de validación

- efecto o papel definitivo de fertilidad;
- equivalencia entre supervivencia secuencial y la fórmula anual basada en suma de mortalidades;
- tratamiento alimenticio de hembras abiertas dentro de gestación;
- validación fina de costos y resultados contra el Excel fuente;
- criterio definitivo de costo de autorreemplazo;
- validación funcional integral del reporte;
- tolerancias formales por indicador para aceptar equivalencia con el modelo fuente.

No deben cambiarse estas convenciones únicamente para hacer coincidir cifras: cualquier cambio requiere decisión metodológica, prueba y registro en `CHANGELOG.md` y `docs/validation.md`.
