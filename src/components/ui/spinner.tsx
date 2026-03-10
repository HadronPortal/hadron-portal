const Spinner = ({ size = 10 }: { size?: number }) => (
  <div className="flex items-center justify-center py-16 gap-1.5">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="rounded-full bg-primary"
        style={{
          width: size,
          height: size,
          animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite both`,
        }}
      />
    ))}
    <style>{`
      @keyframes bounce-dot {
        0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
        40% { transform: scale(1); opacity: 1; }
      }
    `}</style>
  </div>
);

export default Spinner;
