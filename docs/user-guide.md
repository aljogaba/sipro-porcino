# Guía de usuario de SIPRO-Porcino

Versión documentada: `v1.2.4-dev`

SIPRO-Porcino es una herramienta en desarrollo. Antes de usar sus resultados para decisiones técnicas o económicas, revise `docs/validation.md` y las advertencias de esta guía.

Aplicación: https://aljogaba.github.io/sipro-porcino/

## 1. Cómo iniciar

Abra la aplicación en un navegador moderno. Los valores de referencia se cargan automáticamente desde `data/default-parameters.json`.

El botón **Restaurar valores base** devuelve la simulación a esos valores de referencia.

Los cambios realizados durante una sesión actualizan los resultados en el navegador. La versión actual no documenta persistencia automática de una simulación entre sesiones.

## 2. Orden recomendado de captura

La navegación lateral organiza el flujo de trabajo en **Entradas**, **Costos operativos** y **Salidas**.

Orden recomendado:

1. Parámetros productivos.
2. Etapas productivas.
3. Consumo de alimento.
4. Seleccionar el modo de costo de alimento.
5. Capturar costos de dietas compradas o configurar formulación propia.
6. Mano de obra.
7. Gastos extras.
8. Gastos sanitarios, impuestos y servicios.
9. Pie de cría, reemplazos y desechos.
10. Revisar resultados productivos, flujo e inventarios.
11. Revisar alimento y resumen económico.
12. Interpretar visualizaciones, escenarios y sensibilidad.
13. Revisar la auditoría del modelo.
14. Generar el reporte de la simulación.

## 3. Parámetros obligatorios y valores base

La aplicación carga valores base para poder ejecutar una simulación completa sin capturar todos los campos desde cero. Esto no significa que sean adecuados para todas las granjas.

Revise especialmente:

- número de vientres;
- paridad;
- días de lactancia;
- días abiertos;
- LNV/hembra;
- mortalidad por etapa;
- peso a mercado;
- precio de venta/kg;
- duración de etapas;
- consumos diarios de alimento;
- costos de alimento;
- mano de obra;
- gastos operativos;
- reemplazo de hembras y costos asociados.

El campo **% Fertilidad** está visible y se conserva en la simulación, pero en `v1.2.4-dev` no interviene directamente en las fórmulas productivas implementadas. Consulte `docs/assumptions.md`.

## 4. Entradas productivas

### 4.1 Parámetros productivos

Capture o revise las variables que determinan el flujo del sistema: vientres, paridad, fertilidad, lactancia, días abiertos, nacidos vivos, mortalidades, peso y precio de venta.

Los resultados se recalculan al editar los campos.

### 4.2 Duración de etapas

Define las semanas asignadas a Fase 1, Fase 2, Fase 3, Iniciación, Crecimiento, Desarrollo y Finalización.

Estas duraciones afectan:

- días a mercado;
- inventarios por etapa;
- cantidad de animales alimentados;
- consumo y costo de alimento.

### 4.3 Consumo de alimento

Capture kg/animal/día para cada dieta o etapa. El modelo combina consumo diario, inventario alimentado y costo/kg para estimar consumo y costo semanal y mensual.

## 5. Dietas compradas vs formulación propia

El módulo de alimento tiene dos modos mutuamente alternativos.

### Dietas compradas

Úselo cuando se conoce directamente el costo por kg de cada dieta terminada o maquilada.

Procedimiento:

1. seleccione **Dietas compradas**;
2. capture el costo/kg de cada dieta;
3. revise el módulo **Alimento** en las salidas.

### Formulación propia

Úselo cuando desea estimar el costo económico de las dietas a partir de ingredientes, núcleos y medicación/premezclas.

Procedimiento:

1. seleccione **Formulación propia**;
2. revise precios de ingredientes;
3. revise precios de núcleos o dietas completas;
4. capture kg/ton por dieta;
5. compruebe que ingredientes + núcleo sumen `1,000 kg`;
6. revise medicación y premezclas;
7. consulte costo/ton, costo/kg y balance mensual de insumos.

La formulación propia es **económica, no nutricional**. No calcula requerimientos de energía, proteína, aminoácidos, minerales u otras restricciones nutricionales.

Fase 0 y Fase 1 se manejan como dietas completas dentro de la estructura actual.

## 6. Medicación y premezclas

Este bloque aparece dentro de **Formulación propia**.

Los productos precargados son ejemplos editables. Puede modificar:

- nombre;
- precio/kg;
- inclusión por dieta.

La inclusión se expresa como kg/ton o equivalente técnico por tonelada según la captura del modelo.

Estos productos agregan costo económico, pero no se suman al cierre ponderal de 1,000 kg de la fórmula.

Evite duplicar aquí productos que también vaya a registrar como gasto sanitario mensual fuera del alimento.

## 7. Costos operativos

### 7.1 Mano de obra

Capture:

- número de trabajadores;
- salario semanal.

El modelo estima el costo mensual usando `4.3 semanas/mes`.

### 7.2 Gastos extras

Use este campo para costos mensuales extraordinarios que no correspondan a los módulos detallados.

No duplique medicina/impuestos ni pie de cría en este bloque.

### 7.3 Gastos sanitarios, impuestos y servicios

Cada rubro permite capturar:

- concepto;
- cantidad;
- costo unitario.

La aplicación calcula el total de la fila y el total del rubro. El total mensual de este módulo sustituye el concepto agregado `Medicina, impuestos y varios` del resumen económico.

Los nombres precargados son ejemplos editables, no una lista obligatoria.

## 8. Pie de cría, reemplazos y desechos

Seleccione uno de dos modos para hembras:

- **Autorreemplazo**;
- **Compra externa**.

### Autorreemplazo

El modelo estima el número de hembras de reemplazo a partir del porcentaje anual y asigna un costo usando peso de reemplazo × costo de producción/kg.

Además descuenta económicamente la venta a rastro que habría correspondido a esas hembras. Este ajuste no cambia los KPIs productivos del flujo.

### Compra externa

El costo se calcula con el precio unitario de la hembra comprada.

### Desechos

La cantidad mensual de hembras de desecho usa la misma tasa que el reemplazo mensual. El ingreso de desecho se incorpora a los ingresos generales.

### Machos

La compra se captura como **Machos comprados/año** y se prorratea por mes. El inventario de referencia usa una relación 1:20 respecto a vientres. No se modela venta de machos de desecho.

## 9. Lectura de resultados productivos

El bloque **Indicadores principales** resume, entre otros:

- partos/hembra/año;
- lechones destetados/camada;
- lechones destetados/hembra/año;
- cerdos vendidos/hembra/año;
- cerdos vendidos/mes;
- días a mercado;
- mortalidad global;
- factor de eficiencia;
- inventario total;
- inventario promedio/vientre;
- conversión alimenticia de granja.

No todos estos indicadores usan exactamente la misma convención de supervivencia. Consulte `docs/model-description.md` y `docs/validation.md` antes de comparar resultados finos con otras herramientas.

## 10. Flujo e inventarios

### Flujo productivo

Muestra animales por semana a través de las etapas productivas.

### Inventario productivo

Agrupa animales en lactantes, destete y crecimiento/finalización.

### Hembras reproductivas

Se muestran separadamente como lactando, abiertas y gestantes.

### Reemplazos

Las hembras de reemplazo son una población visible separada y no se agregan al inventario productivo principal ni al consumo de alimento en autorreemplazo, para evitar doble conteo según la lógica actual.

## 11. Alimento

Revise:

- kg/semana y kg/mes;
- costo semanal y mensual por dieta;
- costo total mensual;
- costo promedio por kg de alimento;
- conversión alimenticia de granja.

La conversión de granja se calcula con alimento total mensual dividido entre kg de cerdo vendido al mes.

## 12. Resumen económico

El resumen mensual integra ingresos y egresos.

### Ingresos

Puede incluir:

- venta de cerdos a rastro;
- ingreso por hembras de desecho;
- ajuste negativo por autorreemplazo no vendido, cuando corresponda.

### Egresos

Incluye:

- alimento;
- mano de obra;
- medicina, impuestos y varios;
- gastos extras;
- pie de cría.

Resultados principales:

- ingreso mensual;
- egresos mensuales;
- utilidad mensual;
- utilidad semanal;
- porcentajes de costos y utilidad sobre ingresos.

## 13. Interpretación de gráficos

El tablero gráfico es una capa de visualización y **no modifica los cálculos**.

Incluye:

- **Formación de la utilidad mensual:** puente entre ingresos, egresos y utilidad.
- **Composición de egresos:** participación de cada rubro.
- **Costo de alimento por etapa:** distribución del costo alimenticio.
- **Gastos sanitarios y servicios:** composición del módulo operativo.
- **Pie de cría y desechos:** efecto mensual de reemplazos y desechos.
- **Balance mensual de insumos:** principales ingredientes y núcleos.
- **Utilidad por escenario:** comparación de escenarios predefinidos.
- **Sensibilidad de utilidad:** impacto de pruebas univariadas rápidas.

## 14. Escenarios

Los escenarios no cambian los valores capturados del caso actual. Se calculan sobre copias de los parámetros.

Escenarios disponibles:

- Actual.
- Mejora técnica.
- Presión sanitaria.
- Alimento +10 %.
- Mercado adverso.

Las modificaciones exactas están documentadas en `docs/model-description.md`.

No interprete estos escenarios como predicciones probabilísticas; son comparaciones deterministas de supuestos predefinidos.

## 15. Sensibilidad

El gráfico tornado modifica una variable por prueba y compara la utilidad resultante con la utilidad base, manteniendo las demás variables sin cambio dentro de esa prueba.

Sirve para identificar qué cambios predeterminados producen mayor impacto local en la utilidad del caso capturado.

No representa intervalos de confianza, probabilidad, riesgo estadístico ni incertidumbre del modelo.

## 16. Auditoría del modelo

Antes de cerrar una simulación, revise **Auditoría del modelo**.

Esta sección resume el estado de integración de módulos y puede alertar sobre:

- modo de alimentación;
- cierre de formulaciones;
- integración de medicación/premezclas;
- gastos operativos;
- pie de cría;
- ingresos/egresos;
- autorreemplazo.

La auditoría no corrige automáticamente los cálculos.

## 17. Reporte imprimible y PDF

En **Reporte de la simulación** puede:

- **Abrir reporte HTML**;
- **Descargar HTML**.

El reporte es independiente, responsivo y contiene los valores activos de la simulación.

Para obtener PDF:

1. abra el reporte HTML;
2. use la función **Imprimir** del navegador;
3. seleccione **Guardar como PDF** si está disponible en su sistema.

El PDF es una salida del navegador; SIPRO genera directamente el reporte HTML.

## 18. Advertencias

- `v1.2.4-dev` sigue en desarrollo y validación.
- Los valores precargados son referencias de trabajo, no recomendaciones universales.
- No use la formulación económica como sustituto de formulación nutricional.
- Revise posible doble captura entre medicación/premezclas y gastos sanitarios.
- La fertilidad todavía no modifica directamente el flujo productivo.
- Existen convenciones heredadas del Excel que siguen pendientes de validación fina.
- Una diferencia frente al Excel fuente debe documentarse antes de modificar fórmulas para forzar coincidencia.

## 19. Errores o situaciones comunes

### La formulación propia no aparece

Verifique que esté seleccionado el modo **Formulación propia**.

### Una dieta aparece fuera de balance

Revise que ingredientes + núcleo sumen 1,000 kg. La medicación/premezcla no forma parte de ese cierre ponderal.

### El costo sanitario parece duplicado

Revise que un producto no esté capturado tanto como medicación/premezcla de alimento como gasto sanitario externo.

### Cambié una variable y otros resultados también cambiaron

Es el comportamiento esperado: los módulos están conectados y una entrada productiva puede propagarse a inventarios, alimento, ingresos, egresos y utilidad.

### Los resultados no coinciden exactamente con el Excel fuente

Consulte `docs/validation.md`. Existen cambios de supuestos y módulos incorporados después del modelo original, además de puntos todavía pendientes de validación fina.

## 20. Documentación relacionada

- `README.md`: entrada pública al proyecto.
- `docs/assumptions.md`: supuestos y convenciones.
- `docs/model-description.md`: lógica técnica y ecuaciones.
- `docs/validation.md`: estado e historial de validación.
- `docs/citation-and-license.md`: cita, crédito y derechos.
