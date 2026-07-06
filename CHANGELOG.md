# Changelog

## [0.9.0-dev] - En desarrollo

### Agregado

- Panel dinámico de auditoría del modelo.
- Revisión automática del modo de alimento activo.
- Revisión de cierre de fórmulas a 1,000 kg.
- Trazabilidad de ingresos por hembras de desecho y ajuste de autorreemplazo.
- Resumen de integración entre alimento, gastos sanitarios, pie de cría e ingresos/egresos.

### Documentado

- Pendiente de validación fina Excel vs SIPRO después de la integración de módulos mayores.


Todos los cambios importantes de SIPRO-Porcino serán documentados en este archivo.

## [0.8.1-dev] - En desarrollo

### Cambiado

- Se eliminó `% reemplazo anual machos` del módulo de pie de cría para evitar confusión con el autorreemplazo de hembras.
- La compra de machos ahora se captura como **Machos comprados/año** y se prorratea como gasto mensual opcional.
- El inventario estimado de machos queda como dato informativo basado en la relación 1:20, sin modificar el flujo productivo.
- Se ajustaron textos de ayuda y tabla de resumen para aclarar que no se modela venta de machos de desecho.

## [0.7.0-dev] - En desarrollo

### Agregado

- Módulo de gastos sanitarios, impuestos y servicios.
- Captura editable por rubro con concepto, cantidad, costo unitario y total mensual.
- Rubro específico para honorarios veterinarios.
- Resumen automático por rubro con porcentaje de participación.
- Integración automática del total del módulo al concepto “Medicina, impuestos y varios” del resumen económico.
- Separación explícita entre medicación/premezclas en alimento y gastos sanitarios fuera del alimento para evitar doble conteo.

### Cambiado

- El panel “Otros costos mensuales” ahora excluye “Medicina, impuestos y varios”, porque ese valor se calcula desde el nuevo módulo detallado.
- Se documenta que los elementos gráficos comparativos se integrarán posteriormente con un diseño homologado.

## [0.6.1-dev] - En desarrollo

### Cambiado

- Todos los productos del módulo de medicación y premezclas ahora tienen nombre editable.
- Los productos precargados se documentan como ejemplos modificables, no como lista fija del modelo.
- Se ajustan notas de ayuda para explicar que el usuario puede cambiar nombre, precio e inclusión por dieta.

## [0.6.0-dev] - En desarrollo

### Agregado

- Módulo inicial de medicación y premezclas como costo no ponderal por tonelada de dieta.
- Tabla editable de productos, precios e inclusiones por dieta.
- Cálculo automático de costo de medicación/premezcla por tonelada y por kg de dieta.
- Integración automática de estos costos al modo `Formulación propia`, sin alterar el cierre de 1,000 kg de la fórmula alimenticia.
- Resumen mensual estimado de kg y costo de medicación/premezcla ligado al consumo de alimento.

### Cambiado

- El módulo de formulación propia ahora calcula el costo/kg de dietas usando ingredientes, núcleos y medicación/premezcla no ponderal.
- Fase 0 y Fase 1 permanecen fuera del módulo de medicación/premezcla por tratarse como dietas completas compradas.

## [0.5.3-dev] - En desarrollo

### Cambiado

- Los campos editables de valores económicos se muestran con separador de miles y dos decimales.
- Los campos editables de pesos/kg por tonelada se muestran con separador de miles y un decimal.
- Los campos numéricos cambian a modo de edición limpio al recibir foco y se vuelven a formatear al salir del campo.

### Corregido

- La lectura de números acepta separadores de miles, evitando problemas al capturar valores grandes en costos o kg/ton.

## [0.5.2-dev] - En desarrollo

### Agregado

- Ayudas contextuales con iconos `?` en el módulo de formulación económica.
- Guía rápida para explicar la base de 1,000 kg por tonelada, el uso de núcleos y el caso especial de Fase 0/Fase 1 como dietas completas.
- Etiquetas visuales para identificar Fase 0 y Fase 1 como dietas completas.

### Cambiado

- Los valores económicos editables del módulo de alimentación se muestran con dos decimales.
- Los campos de kg/ton en formulación se muestran con un decimal.
- Las entradas de formulación actualizan el cálculo al confirmar el campo, evitando que la tabla se reconstruya en cada tecla y permitiendo capturar cifras completas.


## [0.5.1-dev] - En desarrollo

### Corregido

- El módulo de formulación alimenticia queda oculto cuando el modo activo es `Dietas compradas`.
- El selector de costo de alimento ahora muestra solo el flujo operativo correspondiente al modo seleccionado.
- Se reduce la confusión visual del módulo de alimentación al separar claramente captura de dietas compradas y formulación propia.

## [0.5.0-dev] - En desarrollo

### Agregado

- Módulo de formulación económica de dietas por tonelada.
- Tabla editable de ingredientes y precios.
- Tabla editable de núcleos/dietas completas por etapa.
- Fórmulas por tonelada con validación de suma a 1000 kg.
- Cálculo automático de costo/ton y costo/kg por dieta formulada.
- Balance mensual de insumos ligado al consumo estimado de alimento.
- Transferencia automática al modo “Formulación propia”.

### Cambiado

- Homologación del término “Engorda” a “Finalización” en la interfaz.
- El modo “Formulación propia” deja de usar costos bloqueados de referencia y ahora usa costos calculados desde ingredientes y fórmulas.

### Pendiente

- Integrar medicación/suplementación no ponderal desde el módulo de medicación/premezclas.
- Validación fina de costos formulados contra el Excel fuente, considerando que esta versión excluye temporalmente el costo de medicación.

## [0.4.2-dev] - En desarrollo

### Corregido

- Ajuste de distribución para evitar que el balance lateral se encime sobre los paneles principales.
- Reducción responsiva del tamaño de cifras monetarias en tarjetas para evitar desbordamientos.
- Reasignación visual de `Días a mercado` como indicador productivo no preventivo.

### Agregado

- Inventario de hembras reproductivas separado del inventario de cerdos en producción: lactando, abiertas y gestantes.

## [0.4.1-dev] - En desarrollo

### Agregado

- Se agregó el indicador `Lechones destetados/hembra/año` al bloque de resultados productivos.
- Se incorporó un panel lateral persistente de balance mensual con ingresos, egresos, utilidad, costo de alimento, conversión alimenticia y margen.

### Cambiado

- Se reorganizó el bloque principal de indicadores para mantener un orden productivo.
- Se retiraron ingresos, egresos, utilidad y costo de alimento del bloque principal para evitar duplicidad con el resumen económico detallado.


## [0.4.0-dev] - En desarrollo

### Agregado

- Módulo inicial de análisis de escenarios.
- Comparación rápida entre escenario actual, mejora técnica, presión sanitaria, incremento de alimento y mercado adverso.
- Cálculo de cambios en utilidad mensual, ingresos, egresos, costo de alimento y cerdos vendidos/mes.
- Escenarios calculados como proyecciones paralelas sin modificar los parámetros capturados por el usuario.

## [0.3.0-dev] - En desarrollo

### Agregado

- Módulo inicial de resumen económico mensual.
- Entradas editables para mano de obra y otros costos mensuales.
- Cálculo de egresos totales, utilidad mensual y utilidad semanal.
- Tabla de egresos con porcentaje sobre egresos totales y sobre ingresos.
- Integración del costo de alimento mensual dentro del resumen económico.

## [0.2.1-dev] - En desarrollo

### Agregado

- Selector de modo para costo de alimento: dietas compradas y formulación propia.
- Separación de costos editables para dietas compradas y costos formulados de referencia.
- Bloqueo visual del modo de formulación propia hasta migrar la hoja de formulación alimenticia.

## [0.2.0-dev] - En desarrollo

### Agregado

- Módulo inicial de consumo y costo de alimento.
- Cálculo de alimento semanal y mensual por etapa.
- Costo de alimento por semana, por mes y por kg.
- Conversión alimenticia de granja.

## [0.1.2-dev] - En desarrollo

### Cambiado

- Actualización del supuesto técnico de gestación base a 115 días.
- Los días de gestación quedan como parámetro técnico en el archivo JSON.

## [0.1.1-dev] - En desarrollo

### Agregado

- Entrada editable para días abiertos.
- Ajuste del ciclo reproductivo: gestación + lactancia + días abiertos.

## [0.1.0-dev] - En desarrollo

### Agregado

- Estructura inicial del repositorio.
- Definición de identidad del proyecto.
- Organización modular para inventarios, flujo reproductivo, alimento, costos y resumen económico.
- Integración conceptual con el Laboratorio de Sistemas Porcícolas.

## [0.8.0-dev] - En desarrollo

### Agregado

- Módulo **Pie de cría, reemplazos y desechos**.
- Selector de modo de reemplazo de hembras: **autorreemplazo** o **compra externa**.
- Cálculo de hembras reemplazadas/mes y hembras de desecho/mes a partir del porcentaje anual de reemplazo.
- Inventario visible de hembras de reemplazo, separado del inventario productivo para evitar doble conteo de alimento.
- Ingreso mensual por venta de hembras de desecho, integrado a ingresos generales.
- Descuento económico por hembras de autorreemplazo que salen del flujo de venta a rastro, sin modificar los indicadores productivos.
- Cálculo de costo mensual de reemplazo de hembras y compra opcional de machos.
- Integración automática de egresos de pie de cría en el resumen económico.

### Corregido

- Se conserva la posición de scroll durante la captura en tablas largas para evitar regresar al inicio de la página.
- Se conserva el estado abierto/cerrado de rubros en gastos operativos durante la edición.