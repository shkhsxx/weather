export default function Footer() {
  return (
    <footer className="footer">
      <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
        Weather data by Open-Meteo.com (CC BY 4.0)
      </a>
      <style jsx>{`
        .footer {
          position: fixed;
          left: var(--sp-3);
          bottom: var(--sp-2);
          z-index: 5;
          font-size: var(--fs-caption);
          color: var(--color-text-dim);
        }
        .footer a {
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </footer>
  );
}
