/**
 * The dimmed backdrop behind a dialog. It's a button for accessibility:
 * closing by clicking outside must also be possible from the keyboard, and
 * the screen reader must be able to say what it does.
 */
export interface DialogScrimProps {
  label: string;
  onClose: () => void;
}

export function DialogScrim({ label, onClose }: DialogScrimProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClose}
      className="absolute inset-0 h-full w-full cursor-default bg-bg/80 backdrop-blur-sm"
    />
  );
}
