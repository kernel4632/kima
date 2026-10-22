// Alert / Result / Timeline 共用的状态词与图标，不以颜色作为唯一提示。
import { InformationCircleIcon, CheckmarkCircle02Icon, Alert02Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";

const statuses = {
  neutral: { label: "提示", icon: InformationCircleIcon },
  info: { label: "信息", icon: InformationCircleIcon },
  success: { label: "成功", icon: CheckmarkCircle02Icon },
  warning: { label: "警告", icon: Alert02Icon },
  danger: { label: "错误", icon: AlertCircleIcon },
};
export function displayStatus(variant) {
  return { variant: Object.hasOwn(statuses, variant) ? variant : "neutral", ...(statuses[variant] || statuses.neutral) };
}
