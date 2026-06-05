import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DataTable({
  rows
}: {
  rows: Array<Record<string, string | number | boolean | null | undefined>>;
}) {
  const keys = rows[0] ? Object.keys(rows[0]).slice(0, 5) : ["estado"];
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {keys.map((key) => <TableHead key={key}>{key}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? rows.map((row, index) => (
            <TableRow key={index}>
              {keys.map((key) => (
                <TableCell key={key}>
                  {typeof row[key] === "boolean" ? <Badge variant={row[key] ? "default" : "secondary"}>{row[key] ? "visible" : "oculto"}</Badge> : String(row[key] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={keys.length} className="h-24 text-center text-muted-foreground">Sin registros.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
