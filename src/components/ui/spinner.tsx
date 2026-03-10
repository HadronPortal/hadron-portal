const Spinner = ({ size = 32 }: { size?: number }) => (
  <div className="flex items-center justify-center py-16">
    <div
      className="rounded-full border-[3px] border-muted border-t-primary animate-spin"
      style={{ width: size, height: size }}
    />
  </div>
);

export default Spinner;
