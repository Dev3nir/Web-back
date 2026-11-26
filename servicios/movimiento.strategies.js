/**
 * PATRÓN STRATEGY — reglas por tipo de movimiento.
 * ------------------------------------------------
 * Cada tipo de movimiento exige datos distintos:
 *   reasignacion          → destino obligatorio
 *   reutilizacion         → destino obligatorio
 *   conservacion          → destino obligatorio
 *   gestion_especializada → gestor_id + peso_kg obligatorios
 *
 * Agregar un tipo nuevo = crear una clase que herede de MovimientoStrategy
 * y registrarla en el mapa. El controlador no se toca (Open/Closed Principle).
 */

class MovimientoStrategy {
  constructor(tipo, etiqueta) {
    this.tipo = tipo;
    this.etiqueta = etiqueta;
  }
  /** @returns {Promise<{errores: string[], advertencias: string[]}>} */
  // eslint-disable-next-line no-unused-vars
  async validar(data, ctx = {}) {
    return { errores: [], advertencias: [] };
  }
  exigirDestino(data, errores, mensaje) {
    if (!data.destino) errores.push(mensaje);
  }
}

class ReasignacionStrategy extends MovimientoStrategy {
  constructor() { super('reasignacion', 'Reasignación'); }
  async validar(data) {
    const errores = [];
    this.exigirDestino(data, errores,
      'Indica a qué laboratorio, departamento o usuario se reasigna el equipo');
    if (data.gestor_id) errores.push('Una reasignación no lleva gestor');
    return { errores, advertencias: [] };
  }
}

class ReutilizacionStrategy extends MovimientoStrategy {
  constructor() { super('reutilizacion', 'Reutilización'); }
  async validar(data) {
    const errores = [];
    this.exigirDestino(data, errores,
      'Indica dónde se reutiliza el equipo (área, laboratorio o usuario)');
    if (data.gestor_id) errores.push('Una reutilización no lleva gestor');
    return { errores, advertencias: [] };
  }
}

class ConservacionStrategy extends MovimientoStrategy {
  constructor() { super('conservacion', 'Conservación / resguardo'); }
  async validar(data) {
    const errores = [];
    this.exigirDestino(data, errores,
      'Indica la ubicación donde queda resguardado el equipo');
    if (data.gestor_id) errores.push('Una conservación no lleva gestor');
    return { errores, advertencias: [] };
  }
}

class GestionEspecializadaStrategy extends MovimientoStrategy {
  constructor() { super('gestion_especializada', 'Entrega a gestor especializado'); }
  async validar(data, ctx = {}) {
    const errores = [];
    const advertencias = [];

    if (!data.gestor_id) {
      errores.push('Selecciona el gestor al que se entrega el equipo');
    } else if (!ctx.gestor) {
      errores.push('El gestor indicado no existe');
    } else if (!Number(ctx.gestor.activo)) {
      errores.push('El gestor está inactivo');
    }

    if (data.peso_kg === null || data.peso_kg === undefined) {
      errores.push('Registra el peso entregado en kg');
    }

    return { errores, advertencias };
  }
}

// Mapa de estrategias (mini-factory)
const ESTRATEGIAS = [
  new ReasignacionStrategy(),
  new ReutilizacionStrategy(),
  new ConservacionStrategy(),
  new GestionEspecializadaStrategy(),
].reduce((map, s) => map.set(s.tipo, s), new Map());

function obtenerEstrategia(tipo) {
  return ESTRATEGIAS.get(String(tipo || '').toLowerCase()) || null;
}

function tiposDisponibles() {
  return [...ESTRATEGIAS.values()].map(({ tipo, etiqueta }) => ({ tipo, etiqueta }));
}

module.exports = {
  MovimientoStrategy,
  obtenerEstrategia,
  tiposDisponibles,
  TIPOS_MOVIMIENTO: [...ESTRATEGIAS.keys()],
};