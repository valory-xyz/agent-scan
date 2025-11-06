export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-black">
      <header className="mb-8">
        <h1 className="text-6xl font-bold text-black dark:text-white">
          AgentScan
        </h1>
      </header>
      <main className="text-center">
        <p className="text-2xl text-gray-600 dark:text-gray-400">
          Coming soon<br/><br/>
          Follow us on{" "}
          <a
            href="https://x.com/agentscan_"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-black dark:hover:text-white"
          >
            X
          </a>{" "}
          for launch announcement!
        </p>
      </main>
    </div>
  );
}
