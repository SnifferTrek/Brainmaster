import { Capacitor } from '@capacitor/core';
import { Haptics, NotificationType } from '@capacitor/haptics';

export function hapticResult(success: boolean): void {
  if (!Capacitor.isNativePlatform()) return;
  Haptics.notification({ type: success ? NotificationType.Success : NotificationType.Error }).catch(() => {});
}
