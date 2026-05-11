import { ActivityWorkflowStatus } from '../enums/activity-workflow.enum';
import { ActivityStatusColor } from '../enums/activity-color.enum';

/**
 * Reglas del negocio (document.md):
 * - verde: culminada
 * - amarillo: pendiente y aún no llega fecha fin planificada
 * - rojo: pendiente y ya pasó fecha fin planificada
 */
export function computeActivityStatusColor(
  workflow: ActivityWorkflowStatus,
  plannedEnd: Date,
  now: Date = new Date(),
): ActivityStatusColor {
  if (workflow === ActivityWorkflowStatus.DONE) {
    return ActivityStatusColor.GREEN;
  }
  return plannedEnd.getTime() >= now.getTime()
    ? ActivityStatusColor.YELLOW
    : ActivityStatusColor.RED;
}
