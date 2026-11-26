/**
 * PATRÓN STRATEGY — reglas por tipo de movimiento
 * ------------------------------------------------
 * Problema que resuelve: cada tipo de movimiento de un equipo exige datos
 * distintos (una reasignación necesita a dónde va; una entrega a gestor
 * necesita el gestor, el peso y la evidencia; una baja necesita el motivo...).
 * En lugar de un if/else gigante en el controlador, cada tipo tiene su propia
 * clase con su método `validar()`. Agregar un tipo nuevo = agregar una clase,
 * sin tocar el controlador (principio abierto/cerrado).
 *
 * Todas las estrategias heredan de MovimientoStrategy y devuelven:
 *   { errores: string[], advertencias: string[] }
 */

//------------------------------------------------ CLASE BASE ------------------------------------------------
class MovimientoStrategy {
  constructor(tipo, etiqueta) {
    this.tipo = tipo;
    this.etiqueta = etiqueta;
  }

  /**
   * @param {object} data  movimiento ya limpio (destino, id_gestor, cantidad_kg, evidencia, observaciones)
   * @param {object} ctx   dependencias, p. ej. { gestor } si se buscó en BD
   */
  // eslint-disable-next-line no-unused-vars
  async validar(data, ctx = {}) {
    return { errores: [], advertencias: [] };
  }

  /** Helper para estrategias que exigen un destino documentado. */
  exigirDestino(data, errores, texto) {
    if (!data.destino) errores.push(texto);
  }
}

//------------------------------------------------ ESTRATEGIAS ------------------------------------------------
class IngresoStrategy extends MovimientoStrategy {
  constructor() { super('ingreso', 'Ingreso al inventario'); }
  async validar(data) {
    const errores = [];
    if (data.id_gestor) errores.push('Un ingreso no lleva gestor');
    return { errores, advertencias: [] };
  }
}

class ReasignacionStrategy extends MovimientoStrategy {
  constructor() { super('reasignacion', 'Reasignación / reutilización'); }
  async validar(data) {
    const errores = [];
    this.exigirDestino(data, errores,
      'Indica a qué laboratorio, departamento o usuario se reasigna el equipo');
    if (data.id_gestor) errores.push('Una reasignación no lleva gestor');
    return { errores, advertencias: [] };
  }
}

class EnvioReparacionStrategy extends MovimientoStrategy {
  constructor() { super('envio_reparacion', 'Envío a reparación'); }
  async validar(data) {
    const errores = [];
    this.exigirDestino(data, errores, 'Indica el taller o área que hará la reparación');
    return { errores, advertencias: [] };
  }
}

class RetornoReparacionStrategy extends MovimientoStrategy {
  constructor() { super('retorno_reparacion', 'Regreso de reparación'); }
}

class AlmacenamientoStrategy extends MovimientoStrategy {
  constructor() { super('almacenamiento', 'Almacenamiento / resguardo'); }
  async validar(data) {
    const errores = [];
    this.exigirDestino(data, errores, 'Indica la ubicación donde queda resguardado el equipo');
    return { errores, advertencias: [] };
  }
}

class EntregaGestorStrategy extends MovimientoStrategy {
  constructor() { super('entrega_gestor', 'Entrega a gestor especializado'); }
  async validar(data, ctx = {}) {
    const errores = [];
    const advertencias = [];

    if (!data.id_gestor) {
      errores.push('Selecciona el gestor al que se entrega el equipo');
    } else if (!ctx.gestor) {
      errores.push('El gestor indicado no existe');
    } else {
      if (!Number(ctx.gestor.activo)) errores.push('El gestor está inactivo');
      // No afirmamos que un destino es autorizado si no se ha verificado
      if (!Number(ctx.gestor.verificado)) {
        advertencias.push(
          'El gestor NO está verificado: la entrega quedará registrada, ' +
          'pero no contará como destino autorizado hasta verificarlo.'
        );
      }
    }

    if (data.cantidad_kg === null || data.cantidad_kg === undefined) {
      errores.push('Registra el peso entregado en kg');
    }
    if (!data.evidencia) {
      errores.push('Registra la evidencia de entrega (folio, manifiesto o constancia)');
    }
    return { errores, advertencias };
  }
}

class BajaStrategy extends MovimientoStrategy {
  constructor() { super('baja', 'Baja definitiva'); }
  async validar(data) {
    const errores = [];
    if (!data.observaciones) errores.push('Explica en observaciones el motivo de la baja');
    return { errores, advertencias: [] };
  }
}

//------------------------------------------------ REGISTRO (mini factory) ------------------------------------------------
const ESTRATEGIAS = [
  new IngresoStrategy(),
  new ReasignacionStrategy(),
  new EnvioReparacionStrategy(),
  new RetornoReparacionStrategy(),
  new AlmacenamientoStrategy(),
  new EntregaGestorStrategy(),
  new BajaStrategy(),
].reduce((map, s) => map.set(s.tipo, s), new Map());

/** Devuelve la estrategia del tipo o null si el tipo no existe. */
function obtenerEstrategia(tipo) {
  return ESTRATEGIAS.get(String(tipo || '').toLowerCase()) || null;
}

/** Lista [{ tipo, etiqueta }] para llenar selects en el front. */
function tiposDisponibles() {
  return [...ESTRATEGIAS.values()].map(({ tipo, etiqueta }) => ({ tipo, etiqueta }));
}

module.exports = {
  MovimientoStrategy,
  obtenerEstrategia,
  tiposDisponibles,
  TIPOS_MOVIMIENTO: [...ESTRATEGIAS.keys()],
};
