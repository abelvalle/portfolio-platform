"use client";

import { useCallback, useEffect, useState } from "react";
import { MailOpen, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminClient, type ContactMessage } from "@/lib/api";

const filters = [
  { label: "Todos", value: "" },
  { label: "No leidos", value: "unread" },
  { label: "Leidos", value: "read" }
];

export function ContactMessageManagement() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState("");
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
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="grid gap-3">
        {messages.length ? messages.map((item) => (
          <article key={item.id} className="rounded-lg border border-border bg-card p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{item.subject || "Sin asunto"}</h2>
                  <Badge variant={item.status === "unread" ? "default" : "outline"}>{item.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.name} - {item.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
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
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.message}</p>
          </article>
        )) : (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">Sin mensajes.</div>
        )}
      </section>
    </div>
  );
}
