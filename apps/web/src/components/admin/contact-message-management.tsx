"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, MailOpen, RefreshCw, Reply, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminClient, type ContactMessage } from "@/lib/api";

const filters = [
  { label: "Todos", value: "" },
  { label: "No leidos", value: "unread" },
  { label: "Leidos", value: "read" }
];

export function ContactMessageManagement() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [message, setMessage] = useState("Cargando mensajes.");
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = useCallback(async (status = filter) => {
    setIsLoading(true);
    try {
      const nextMessages = await adminClient.contactMessages(status || undefined);
      setMessages(nextMessages);
      setMessage(nextMessages.length ? "Mensajes sincronizados." : "No hay mensajes para este filtro.");
    } catch {
      setMessage("No se pudieron cargar mensajes. Comprueba sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMessages(filter);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [filter, loadMessages]);

  const visibleMessages = useMemo(() => {
    return messages.filter((item) => isInsideDateRange(item.createdAt, fromDate, toDate));
  }, [fromDate, messages, toDate]);

  const selectedMessage = useMemo(() => {
    return messages.find((item) => item.id === selectedMessageId) || null;
  }, [messages, selectedMessageId]);

  async function setStatus(item: ContactMessage, status: string) {
    try {
      const updated = await adminClient.updateContactMessageStatus(item.id, status);
      setMessages((current) => current.map((messageItem) => (messageItem.id === updated.id ? updated : messageItem)));
      setMessage(`Mensaje marcado como ${status}.`);
    } catch {
      setMessage("No se pudo actualizar el estado.");
    }
  }

  async function deleteMessage(item: ContactMessage) {
    try {
      await adminClient.deleteContactMessage(item.id);
      setMessages((current) => current.filter((messageItem) => messageItem.id !== item.id));
      setSelectedMessageId((current) => (current === item.id ? null : current));
      setMessage("Mensaje eliminado.");
    } catch {
      setMessage("No se pudo eliminar el mensaje.");
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Mensajes de contacto</h1>
            <p className="mt-2 text-sm text-muted-foreground">Bandeja conectada a la API REST.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => loadMessages()} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button key={item.value || "all"} type="button" variant={filter === item.value ? "default" : "outline"} size="sm" onClick={() => setFilter(item.value)}>
              {item.label}
            </Button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <div className="grid gap-2">
            <Label htmlFor="fromDate">Desde</Label>
            <Input id="fromDate" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="toDate">Hasta</Label>
            <Input id="toDate" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      {selectedMessage ? (
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-sm text-primary">Detalle</p>
              <h2 className="mt-2 text-2xl font-semibold">{selectedMessage.subject || "Sin asunto"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedMessage.name} - {selectedMessage.email} - {formatDate(selectedMessage.createdAt)}
              </p>
            </div>
            <Badge variant={selectedMessage.status === "unread" ? "default" : "outline"}>{selectedMessage.status}</Badge>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{selectedMessage.message}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={buildReplyMailto(selectedMessage)}
              className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Reply data-icon="inline-start" />
              Responder email
            </a>
            <Button type="button" variant="outline" size="sm" onClick={() => setStatus(selectedMessage, selectedMessage.status === "unread" ? "read" : "unread")}>
              <MailOpen data-icon="inline-start" />
              {selectedMessage.status === "unread" ? "Marcar leido" : "Marcar no leido"}
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => deleteMessage(selectedMessage)}>
              <Trash2 data-icon="inline-start" />
              Borrar mensaje
            </Button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3">
        {visibleMessages.length ? visibleMessages.map((item) => (
          <article key={item.id} className="rounded-lg border border-border bg-card p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{item.subject || "Sin asunto"}</h2>
                  <Badge variant={item.status === "unread" ? "default" : "outline"}>{item.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.name} - {item.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedMessageId(item.id)}>
                  <Eye data-icon="inline-start" />
                  Detalle
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setStatus(item, item.status === "unread" ? "read" : "unread")}>
                  <MailOpen data-icon="inline-start" />
                  {item.status === "unread" ? "Leido" : "No leido"}
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => deleteMessage(item)}>
                  <Trash2 data-icon="inline-start" />
                  Borrar
                </Button>
              </div>
            </div>
            <p className="mt-4 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.message}</p>
          </article>
        )) : (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">Sin mensajes para los filtros actuales.</div>
        )}
      </section>
    </div>
  );
}

function isInsideDateRange(createdAt: string, fromDate: string, toDate: string) {
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) {
    return true;
  }
  if (fromDate && createdTime < new Date(`${fromDate}T00:00:00`).getTime()) {
    return false;
  }
  if (toDate && createdTime > new Date(`${toDate}T23:59:59`).getTime()) {
    return false;
  }
  return true;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function buildReplyMailto(item: ContactMessage) {
  const subject = item.subject ? `Re: ${item.subject}` : "Re: contacto desde portfolio";
  const body = [
    `Hola ${item.name},`,
    "",
    "",
    "---",
    `Mensaje original (${formatDate(item.createdAt)}):`,
    item.message
  ].join("\n");

  return `mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
