interface PageDotsProps {
  count: number;
  index: number;
}

export function PageDots({ count, index }: PageDotsProps) {
  return (
    <div className="dots" role="img" aria-label={`Step ${index + 1} of ${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <i key={i} aria-current={i === index}></i>
      ))}
    </div>
  );
}
