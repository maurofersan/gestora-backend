/**
 * Genera assets/schedule-import-plantilla.tsv (≥100 filas de ejemplo).
 * Especialidades alineadas al catálogo de la empresa (3 disciplinas).
 * Ejecutar: node scripts/generate-schedule-template.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Nombres exactos como en MongoDB (company specialties). */
const ESPECIALIDAD_ESTRUCTURA = 'Estructura';
const ESPECIALIDAD_MEP = 'Instalaciones (MEP)';
const ESPECIALIDAD_ARQUITECTURA = 'Arquitectura y terminaciones';

const partidas = [
  'OBRAS PROVISIONALES, SEGURIDAD Y SALUD EN EL TRABAJO',
  'OBRAS PROVISIONALES',
  'SEGURIDAD Y SALUD DURANTE LA OBRA',
  'DEMOLICIONES Y REPOSICION DE ESTRUCTURAS EXISTENTES',
  'EXPLANACION GENERAL',
  'MOVIMIENTO DE TIERRA',
  'SERVICIOS HIGIENICOS',
  'ESTRUCTURAS METALICAS',
  'CUBIERTA Y TECHUMBRE',
  'INSTALACIONES ELECTRICAS',
  'INSTALACIONES SANITARIAS',
  'PISOS Y PAVIMENTOS',
  'CERRAMIENTOS',
  'PINTURA Y ACABADOS',
  'AREA DE JUEGOS',
];

const sectores = [
  'ZONA GENERAL',
  'CANCHA PRINCIPAL',
  'ZONA NORTE',
  'ZONA SUR',
  'ACCESOS',
  'VESTUARIOS',
  'ESTACIONAMIENTO',
  'PERIMETRO',
];

const tareas = [
  'CARTEL DE OBRA DE 3.60 X 2.40M.',
  'ALQUILER DE LOCAL PARA ALMACEN Y OFICINA',
  'SERVICIOS DE BAÑO PORTATIL (INODORO Y LAVADERO)',
  'ELABORACION E IMPLEMENTACION DEL PLAN DE SEGURIDAD',
  'DEMOLICION DE MURO EXISTENTE',
  'REPOSICION DE CERCO PERIMETRAL',
  'LIMPIEZA DEL TERRENO MANUAL',
  'RELLENO CON GRAVA CLASIFICADO',
  'COMPACTACION DE SUBRASANTE',
  'NIVELACION DE TERRENO',
  'EXCAVACION PARA CIMIENTOS',
  'HORMIGON DE LIMPIEZA',
  'MONTAJE DE ESTRUCTURA METALICA',
  'COLOCACION DE CUBIERTA',
  'TENDIDO DE RED ELECTRICA',
  'INSTALACION DE TABLERO GENERAL',
  'TENDIDO DE AGUA POTABLE',
  'INSTALACION DE DESAGUE',
  'CONTRAPISO DE CEMENTO PULIDO',
  'PINTURA DE CERRAMIENTO',
  'INSTALACION DE PUERTAS',
  'SEÑALETICA DE SEGURIDAD',
  'PRUEBA DE PRESION DE RED',
  'ENTREGA DE AREA LIMPIA',
];

function resolveSpecialty(descripcion, partidaNombre) {
  const d = descripcion.toUpperCase();
  const p = partidaNombre.toUpperCase();

  if (
    d.includes('ESTRUCTURA METALICA') ||
    d.includes('HORMIGON') ||
    d.includes('EXCAVACION') ||
    d.includes('CIMIENTO') ||
    d.includes('DEMOLICION') ||
    d.includes('RELLENO') ||
    d.includes('COMPACTACION') ||
    d.includes('NIVELACION') ||
    d.includes('LIMPIEZA DEL TERRENO') ||
    d.includes('COLOCACION DE CUBIERTA') ||
    d.includes('PLAN DE SEGURIDAD') ||
    d.includes('CERCO PERIMETRAL') ||
    p.includes('ESTRUCTURAS METALIC') ||
    p.includes('EXPLANACION') ||
    p.includes('MOVIMIENTO DE TIERRA') ||
    p.includes('DEMOLICIONES') ||
    p.includes('CUBIERTA Y TECHUMBRE')
  ) {
    return ESPECIALIDAD_ESTRUCTURA;
  }

  if (
    p.includes('INSTALACIONES ELECTRIC') ||
    p.includes('INSTALACIONES SANITAR') ||
    d.includes('ELECTRIC') ||
    d.includes('TABLERO') ||
    d.includes('AGUA POTABLE') ||
    d.includes('DESAGUE') ||
    d.includes('PRESION DE RED')
  ) {
    return ESPECIALIDAD_MEP;
  }

  if (
    p.includes('PINTURA') ||
    p.includes('CERRAMIENTO') ||
    p.includes('PISOS') ||
    p.includes('AREA DE JUEGOS') ||
    d.includes('PINTURA') ||
    d.includes('PUERTAS') ||
    d.includes('CONTRAPISO') ||
    d.includes('ENTREGA DE AREA LIMPIA') ||
    d.includes('CARTEL DE OBRA') ||
    d.includes('BAÑO PORTATIL') ||
    d.includes('ALQUILER DE LOCAL')
  ) {
    return ESPECIALIDAD_ARQUITECTURA;
  }

  return ESPECIALIDAD_ESTRUCTURA;
}

function addDays(iso, days) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const header =
  'codigo\tdescripcion\tpartida_nombre\tsector_nombre\tespecialidad_nombre\tfecha_inicio\tduracion_dias';

const rows = [header];
const start = '2026-04-21';

for (let i = 1; i <= 105; i++) {
  const code = `INF-${String(i).padStart(3, '0')}`;
  const desc = `${tareas[(i - 1) % tareas.length]} (${i})`;
  const partida = partidas[(i - 1) % partidas.length];
  const sector = sectores[(i - 1) % sectores.length];
  const esp = resolveSpecialty(desc, partida);
  const fecha = addDays(start, (i % 37) * 2 + Math.floor(i / 11));
  const dur = (i % 7) + 1;
  rows.push([code, desc, partida, sector, esp, fecha, dur].join('\t'));
}

const out = join(__dirname, '..', 'assets', 'schedule-import-plantilla.tsv');
writeFileSync(out, rows.join('\n'), 'utf8');
console.log(`Written ${rows.length - 1} data rows to ${out}`);
