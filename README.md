# SIPRO-Porcino

**Simulador Integral de Producción Porcina**

SIPRO-Porcino es una herramienta técnico-económica para modelar producción, flujo e inventarios, alimentación, costos operativos, pie de cría, escenarios y resultados económicos en sistemas porcícolas.

Forma parte del **Laboratorio de Sistemas Porcícolas**.

## Créditos

- **Desarrollado por:** Alberto Jorge Galindo-Barboza — https://aljogaba.github.io/
- **Idea inicial:** Eduardo Antonio Barrera Mora.

## Versión y estado

Versión actual: `v1.2.4-dev`

Estado: **en desarrollo y validación**. La versión `-dev` no debe interpretarse como una liberación estable ni como un modelo completamente validado.

## Funciones principales

- parámetros y flujo productivo;
- inventarios productivos y reproductivos;
- consumo y costo de alimento;
- dietas compradas o formulación económica propia;
- medicación y premezclas como costo no ponderal por tonelada;
- gastos sanitarios, impuestos y servicios;
- pie de cría, reemplazos y desechos;
- resumen económico mensual;
- escenarios predefinidos y pruebas rápidas de sensibilidad;
- tablero gráfico de decisión;
- auditoría interna de consistencia y trazabilidad;
- reporte técnico independiente en HTML.

## Alcance

La versión actual representa una **granja de ciclo completo** mediante un modelo determinista técnico-económico derivado de un modelo Excel privado y trasladado progresivamente a una aplicación web. Los parámetros base son valores de referencia editables y no deben interpretarse como recomendaciones universales.

## Limitaciones importantes

- La validación fina contra el Excel fuente continúa abierta para varios módulos.
- La formulación propia es **económica**, no un balance nutricional.
- El porcentaje de fertilidad se conserva como entrada, pero actualmente no interviene directamente en las fórmulas productivas implementadas.
- Existen convenciones heredadas del modelo fuente que permanecen pendientes de validación formal; se describen en `docs/validation.md` y `docs/model-description.md`.
- Los escenarios y la sensibilidad son herramientas exploratorias y no sustituyen una validación técnica del sistema real.

## Aplicación y documentación

- Aplicación: https://aljogaba.github.io/sipro-porcino/
- Validación técnica: [docs/validation.md](docs/validation.md)
- Descripción del modelo: [docs/model-description.md](docs/model-description.md)
- Supuestos: [docs/assumptions.md](docs/assumptions.md)
- Guía de usuario: [docs/user-guide.md](docs/user-guide.md)

## Cita sugerida

Galindo-Barboza, A. J. & Barrera-Mora, E. A. (2026). *SIPRO-Porcino: Simulador Integral de Producción Porcina* (v1.2.4-dev). Laboratorio de Sistemas Porcícolas.

Consulte también `CITATION.cff` y `docs/citation-and-license.md`.

## Derechos

© 2026 Alberto Jorge Galindo-Barboza. Todos los derechos reservados.

El uso, distribución, modificación, reproducción o explotación de este software requiere autorización expresa del autor. Consulte `LICENSE`.
