/**
 * Diyalogun arkasindaki karartma. Dugme olmasinin nedeni erisilebilirlik:
 * disari tiklayarak kapatmak klavyeyle de yapilabilmeli ve ekran okuyucu
 * ne yaptigini soyleyebilmeli.
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
