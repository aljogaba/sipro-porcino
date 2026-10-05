# Supuestos del modelo SIPRO-Porcino

Versión documentada: `v1.2.4-dev`

Este archivo reúne únicamente supuestos y convenciones que pueden identificarse en el código, los parámetros base o el historial de validación. Los valores precargados son **referencias editables del modelo** y no deben interpretarse como recomendaciones universales para una granja real.

## 1. Supuestos productivos

### Base reproductiva

- Sistema de referencia: **granja de ciclo completo**.
- Vientres base: `300`.
- Paridad base: `85 %`.
- Fertilidad base: `85 %`.
- Gestación: `115 días`.
- Lactancia base: `23 días`.
- Días abiertos base: `7 días`.
- LNV/hembra base: `11`.

El ciclo reproductivo se calcula como:

```text
ciclo_semanas = (días_gestación + días_lactancia + días_abiertos) / 7
vientres_servidos_semana = vientres / ciclo_semanas
partos_semana = vientres_servidos_semana × (% paridad / 100)
```

El porcentaje de fertilidad se carga y conserva en el estado del modelo, pero **actualmente no interviene directamente en las fórmulas productivas implementadas**.

**Pendiente de validación:** definir si fertilidad debe incorporarse al flujo reproductivo o conservarse únicamente como dato informativo.

### Mortalidad y supervivencia

Valores base por etapa:

| Etapa | Mortalidad base |
|---|---:|
| Maternidad | 6 % |
| Destete | 5 % |
| Iniciación | 1 % |
| Crecimiento | 1 % |
| Desarrollo | 1 % |
| Finalización | 3 % |

El flujo semanal aplica supervivencia **secuencial** por etapa.

Existe además una convención heredada del Excel fuente para el indicador `Cerdos vendidos/hembra/año`: se calcula una supervivencia global a partir de la **suma aritmética de los porcentajes de mortalidad** y no del producto de supervivencias secuenciales.

**Pendiente de validación:** decidir si esta diferencia entre el flujo secuencial y el indicador anual debe conservarse como equivalencia histórica o unificarse en una versión posterior.

### Peso y mercado

- Peso base de venta: `105 kg/cerdo`.
- Precio base: `46.50 $/kg`.

Ambos son entradas editables.

### Duración de etapas

Valores base:

| Etapa | Duración |
|---|---:|
| Fase 1 | 1 semana |
| Fase 2 | 1 semana |
| Fase 3 | 1 semana |
| Iniciación | 4 semanas |
| Crecimiento | 4 semanas |
| Desarrollo | 4 semanas |
| Finalización | 5 semanas |

Los días a mercado se estiman a partir de lactancia más estas duraciones, expresadas en semanas y convertidas a días.

## 2. Supuestos de inventario

### Inventario productivo

El inventario principal incluye:

- lactantes;
- destete, que agrupa Fase 1, Fase 2, Fase 3 e Iniciación;
- crecimiento/finalización, que agrupa Crecimiento, Desarrollo y Finalización.

El inventario productivo total **no suma** automáticamente vientres reproductivos ni hembras de reemplazo.

### Hembras reproductivas

Se muestran por separado:

```text
hembras_lactando = partos_semana × semanas_lactancia
hembras_abiertas = partos_semana × días_abiertos / 7
hembras_gestantes = vientres - hembras_lactando - hembras_abiertas
```

### Hembras de reemplazo

El inventario visible de reemplazos se calcula como:

```text
reemplazos_mes = vientres × (% reemplazo_anual / 100) / 12
inventario_reemplazos = reemplazos_mes × meses_como_reemplazo
```

En autorreemplazo, esta población se presenta por separado y **no agrega alimento**, porque el modelo considera que proviene del propio flujo productivo y evita un doble conteo.

### Machos

El inventario informativo de machos usa la relación:

```text
machos_referencia = vientres / 20
```

La compra de machos se maneja por número de machos comprados/año y se prorratea mensualmente. No se modela venta de machos de desecho.

## 3. Supuestos temporales

Conversiones implementadas:

- `52 semanas/año` para partos por hembra por año.
- `4.3 semanas/mes` para conversiones mensuales del flujo, alimento, mano de obra y utilidad semanal/mensual.
- `7 días/semana`.

No existe actualmente una constante global de `días/año` utilizada por el modelo.

**Pendiente de definición:** establecer una política temporal única si en futuras versiones se incorporan conversiones anuales económicas o calendarios más detallados.

## 4. Supuestos económicos

### Moneda

El contexto del modelo es México y la documentación de validación expresa los valores monetarios base en **MXN**. La interfaz utiliza el símbolo `$`.

**Pendiente de definición:** si se requiere soporte multimoneda, deberá incorporarse una configuración explícita; actualmente no existe conversión cambiaria.

### Mano de obra

```text
costo_mano_obra_mes = trabajadores × salario_semanal × 4.3
```

Valores base:

- trabajadores: `6`;
- salario semanal: `$2,400`.

### Gastos sanitarios, impuestos y servicios

Cada fila se calcula como:

```text
importe = cantidad × costo_unitario
```

El total del módulo sustituye el campo agregado heredado `Medicina, impuestos y varios` cuando el módulo detallado está habilitado.

Los conceptos precargados son ejemplos editables, no una lista normativa ni obligatoria.

### Gastos extras

Se mantienen como un costo mensual editable para conceptos no clasificados en otros módulos.

### Pie de cría

Valor base de reemplazo anual de hembras: `40 %/año`.

Reglas actuales:

```text
hembras_reemplazo_mes = vientres × tasa_reemplazo_anual / 12
hembras_desecho_mes = hembras_reemplazo_mes
```

En autorreemplazo:

```text
costo_unitario_reemplazo = peso_reemplazo × costo_producción_kg
```

En compra externa se usa el precio unitario capturado por hembra.

El ingreso de desecho se calcula como:

```text
ingreso_desecho_mes = hembras_desecho_mes × peso_desecho × precio_desecho_kg
```

En autorreemplazo se descuenta económicamente la venta a rastro que correspondería a las hembras seleccionadas como reemplazo, sin alterar los indicadores productivos de flujo.

**Pendiente de validación:** confirmar si el costo de producción por kg usado para autorreemplazo debe mantenerse como entrada independiente o derivarse de un costo calculado por SIPRO.

## 5. Supuestos de alimentación

### Consumo

Para cada dieta/etapa:

```text
kg_semana = animales_alimentados × consumo_kg_día × 7
kg_mes = kg_semana × 4.3
costo_semana = kg_semana × costo_kg
costo_mes = costo_semana × 4.3
```

La conversión alimenticia de granja se calcula como:

```text
kg_alimento_mes / kg_cerdo_vendido_mes
```

### Dietas compradas

El usuario captura directamente el costo por kg de cada dieta. Es el modo activo por defecto.

### Formulación propia

- Base de cálculo: `1,000 kg` por dieta.
- El cierre ponderal corresponde a `ingredientes + núcleo = 1,000 kg`.
- Se admite una tolerancia numérica de `±0.01 kg` para considerar balanceada la fórmula.
- Fase 0 y Fase 1 se representan como dietas completas compradas con 1,000 kg en el componente de núcleo/dieta completa.
- El módulo calcula costos, no requerimientos nutricionales.

### Medicación y premezclas

Se manejan como costos **no ponderales** por tonelada:

```text
costo_formulado_ton = costo_ingredientes + costo_núcleo + costo_no_ponderal
costo_formulado_kg = costo_formulado_ton / 1000
```

La medicación/premezcla agrega costo, pero no modifica el cierre de 1,000 kg.

Los productos precargados son ejemplos editables.

### Diferencia actual entre inventario reproductivo y alimento de gestación

El inventario reproductivo visible calcula hembras gestantes restando hembras lactantes **y abiertas**. En cambio, el módulo de alimento calcula el grupo alimentado como gestación usando `vientres - hembras lactantes`, al que suma los machos de referencia.

Esta diferencia reproduce la lógica actualmente implementada y **no debe ocultarse**.

**Pendiente de validación:** revisar si las hembras abiertas deben mantenerse dentro del grupo alimenticio de gestación o separarse explícitamente.

## 6. Escenarios y sensibilidad

Los escenarios son proyecciones paralelas: no modifican los parámetros capturados del escenario actual.

Escenarios predefinidos:

- **Actual:** sin cambios.
- **Mejora técnica:** `+0.5` LNV/hembra, mortalidad maternidad `-2 pp`, destete `-1 pp`, finalización `-1 pp`, costo de alimento `-3 %`.
- **Presión sanitaria:** mortalidad maternidad `+3 pp`, destete `+2 pp`, iniciación `+1 pp`, finalización `+2 pp`.
- **Alimento +10 %:** costo de las dietas activas `+10 %`.
- **Mercado adverso:** precio de venta `-5 %` y costo de alimento `+5 %`.

La sensibilidad del tablero ejecuta pruebas rápidas univariadas y muestra el cambio de utilidad manteniendo las demás variables constantes. Debe interpretarse como exploración del modelo, no como análisis probabilístico.

## 7. Qué representa SIPRO y qué no pretende modelar

En `v1.2.4-dev`, SIPRO representa un modelo determinista técnico-económico de una granja porcina de ciclo completo con módulos de producción, inventario, alimentación, costos, pie de cría, resultados, escenarios y reporte.

Actualmente **no** implementa:

- formulación nutricional por requerimientos;
- optimización matemática de dietas;
- incertidumbre o simulación estocástica;
- modelación epidemiológica o de transmisión de enfermedades;
- contabilidad fiscal completa;
- proyecciones financieras multianuales;
- soporte explícito de múltiples monedas.

Estas ausencias describen el alcance actual; no implican que deban incorporarse necesariamente en versiones futuras.
