# Changelog

Todos los cambios importantes de SIPRO-Porcino serán documentados en este archivo.


## [0.2.1-dev] - En desarrollo

### Agregado

- Selector de modo para costos de alimento: dietas compradas vs. formulación propia.
- Separación de costos de alimento capturados por el usuario y costos formulados de referencia.
- Bloqueo visual de costos formulados hasta integrar el módulo completo de formulación alimenticia.

### Cambiado

- El módulo de alimento ahora selecciona dinámicamente la fuente de costos por kg según el modo activo.

## [0.2.0-dev] - En desarrollo

### Agregado

- Módulo inicial de consumo y costo de alimento.
- Entradas editables para consumo de alimento por día.
- Entradas editables provisionales para costo por kg de alimento por etapa.
- KPIs de costo de alimento mensual, costo de alimento semanal, kg de alimento mensual, costo alimento/kg y conversión alimenticia de granja.
- Tabla de alimento por etapa con inventario alimentado, kg/semana, costo/semana y porcentaje del costo.
- Documentación de validación del módulo de alimento.

### Nota técnica

- Los costos por kg de alimento se mantienen como parámetros editables provisionales hasta integrar el módulo de formulación alimenticia.
- El cálculo de gestación incluye hembras gestantes y machos con relación macho:hembra de 1:20, siguiendo la estructura del Excel fuente.

## [0.1.2-dev] - En desarrollo

### Agregado

- Entrada editable para **días abiertos** en parámetros productivos.
- Cálculo del ciclo reproductivo con fórmula: `(115 + días lactancia + días abiertos) / 7`.
- Documentación de validación actualizada para el ajuste de ciclo reproductivo.

## [0.1.0-dev] - En desarrollo

### Agregado

- Estructura inicial del repositorio.
- Definición de identidad del proyecto.
- Organización modular para inventarios, flujo reproductivo, alimento, costos y resumen económico.
- Integración conceptual con el Laboratorio de Sistemas Porcícolas.
- MVP inicial de inventarios y flujo productivo.
