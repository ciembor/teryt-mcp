export const ansi = {
  blue: "\u001B[34m",
  green: "\u001B[32m",
  magenta: "\u001B[35m",
  red: "\u001B[31m",
  reset: "\u001B[0m",
} as const;

const banner = String.raw`
████████╗███████╗██████╗ ██╗   ██╗████████╗   ███╗   ███╗ ██████╗██████╗
╚══██╔══╝██╔════╝██╔══██╗╚██╗ ██╔╝╚══██╔══╝   ████╗ ████║██╔════╝██╔══██╗
   ██║   █████╗  ██████╔╝ ╚████╔╝    ██║█████╗██╔████╔██║██║     ██████╔╝
   ██║   ██╔══╝  ██╔══██╗  ╚██╔╝     ██║╚════╝██║╚██╔╝██║██║     ██╔═══╝
   ██║   ███████╗██║  ██║   ██║      ██║      ██║ ╚═╝ ██║╚██████╗██║
   ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝      ╚═╝      ╚═╝     ╚═╝ ╚═════╝╚═╝
`;

type Header = {
  readonly authorEmail: string;
  readonly authorName: string;
  readonly repositoryUrl: string;
  readonly serverName: string;
  readonly serverVersion: string;
};

type DataSummary = {
  readonly dataDir: string;
  readonly datasets: readonly {
    readonly dataset: string;
    readonly stateDate: string;
  }[];
  readonly emptyDatasetsMessage?: string;
  readonly status: string;
  readonly successful: boolean;
};

export function formatHeader(header: Header): string {
  return [
    colorize(banner, ansi.magenta),
    `${header.serverName} ${header.serverVersion}`,
    `Author: ${header.authorName} <${header.authorEmail}>`,
    `Repository: ${header.repositoryUrl}`,
    "",
    "",
  ].join("\n");
}

export function formatDataSummary(summary: DataSummary): string {
  const lines = [
    colorize(`Data sync: ${summary.status}.`, summary.successful ? ansi.green : ansi.red),
    `Data directory: ${summary.dataDir}`,
  ];

  if (summary.datasets.length > 0) {
    lines.push("TERYT data state dates:");
    lines.push(...summary.datasets.map((item) => colorize(`  - ${item.dataset}: ${item.stateDate}`, ansi.blue)));
  } else {
    lines.push(summary.emptyDatasetsMessage ?? "TERYT data state dates: unavailable.");
  }

  return `${lines.join("\n")}\n`;
}

export function colorize(text: string, color: string): string {
  return `${color}${text}${ansi.reset}`;
}
