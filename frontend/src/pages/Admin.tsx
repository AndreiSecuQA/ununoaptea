import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

type AdminOrder = {
  id: string;
  email: string;
  first_name: string;
  status: string;
  amount_eur: number;
  created_at: string;
  paid_at: string | null;
  generated_at: string | null;
};

type OrderListResp = {
  orders: AdminOrder[];
  total: number;
  page: number;
  page_size: number;
};

type Metrics = {
  window_days: number;
  total_orders: number;
  recent_orders: number;
  ready_orders: number;
  failed_orders: number;
  failure_rate: number;
  revenue_eur: number;
  status_breakdown: Record<string, number>;
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "în așteptare plată",
  generating: "se generează",
  ready: "gata",
  failed: "eșuat",
  deleted: "șters",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-900",
  generating: "bg-blue-100 text-blue-900",
  ready: "bg-green-100 text-green-900",
  failed: "bg-red-100 text-red-900",
  deleted: "bg-gray-200 text-gray-700",
};

function useBasicAuth() {
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(() => {
    const raw = sessionStorage.getItem("unu-noaptea-admin-creds");
    return raw ? JSON.parse(raw) : null;
  });

  const save = useCallback((email: string, password: string) => {
    const c = { email, password };
    sessionStorage.setItem("unu-noaptea-admin-creds", JSON.stringify(c));
    setCreds(c);
  }, []);

  const clear = useCallback(() => {
    sessionStorage.removeItem("unu-noaptea-admin-creds");
    setCreds(null);
  }, []);

  const header = creds ? "Basic " + btoa(`${creds.email}:${creds.password}`) : null;
  return { creds, save, clear, header };
}

export default function Admin() {
  const { creds, save, clear, header } = useBasicAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [emailSearch, setEmailSearch] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!header) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: "20",
      });
      if (statusFilter) params.set("status", statusFilter);
      if (emailSearch) params.set("email", emailSearch);

      const [listRes, metricsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/admin/orders?${params.toString()}`, {
          headers: { Authorization: header },
        }),
        fetch(`${API_URL}/api/v1/admin/metrics`, {
          headers: { Authorization: header },
        }),
      ]);
      if (listRes.status === 401 || metricsRes.status === 401) {
        clear();
        setError("Credențiale invalide.");
        return;
      }
      if (!listRes.ok) throw new Error(`list: ${listRes.status}`);
      if (!metricsRes.ok) throw new Error(`metrics: ${metricsRes.status}`);
      const listData: OrderListResp = await listRes.json();
      const metricsData: Metrics = await metricsRes.json();
      setOrders(listData.orders);
      setTotal(listData.total);
      setMetrics(metricsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare necunoscută.");
    } finally {
      setLoading(false);
    }
  }, [header, page, statusFilter, emailSearch, clear]);

  useEffect(() => {
    if (header) void fetchData();
  }, [header, fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const hdr = "Basic " + btoa(`${email}:${password}`);
    const r = await fetch(`${API_URL}/api/v1/admin/metrics`, {
      headers: { Authorization: hdr },
    });
    if (r.ok) {
      save(email, password);
    } else {
      setLoginError("Email sau parolă invalide.");
    }
  };

  const resendEmail = async (orderId: string) => {
    if (!header) return;
    setActionMsg(null);
    const r = await fetch(
      `${API_URL}/api/v1/admin/orders/${orderId}/resend-email`,
      { method: "POST", headers: { Authorization: header } }
    );
    setActionMsg(r.ok ? "Email retrimis." : `Eroare (${r.status}).`);
  };

  const regenerate = async (orderId: string) => {
    if (!header) return;
    setActionMsg(null);
    const r = await fetch(
      `${API_URL}/api/v1/admin/orders/${orderId}/regenerate`,
      { method: "POST", headers: { Authorization: header } }
    );
    setActionMsg(r.ok ? "Regenerare pornită." : `Eroare (${r.status}).`);
    if (r.ok) void fetchData();
  };

  const csvUrl = useMemo(
    () => `${API_URL}/api/v1/admin/orders.csv${statusFilter ? `?status=${statusFilter}` : ""}`,
    [statusFilter]
  );

  if (!creds) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6">
        <h1 className="text-2xl font-serif mb-6">Admin — autentificare</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block">
            <span className="text-sm text-gray-700">Email admin</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 border rounded px-3 py-2"
              required
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-700">Parolă</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 border rounded px-3 py-2"
              required
            />
          </label>
          {loginError && <p className="text-red-700 text-sm">{loginError}</p>}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            Intră
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">Admin — comenzi Unu Noaptea</h1>
        <button onClick={clear} className="text-sm text-gray-600 underline">
          Ieși ({creds.email})
        </button>
      </header>

      {metrics && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Total comenzi" value={metrics.total_orders} />
          <MetricCard
            label={`Comenzi ${metrics.window_days}z`}
            value={metrics.recent_orders}
          />
          <MetricCard
            label="Venituri (EUR)"
            value={`€${metrics.revenue_eur.toFixed(2)}`}
          />
          <MetricCard
            label="Rata eșec"
            value={`${(metrics.failure_rate * 100).toFixed(1)}%`}
          />
        </section>
      )}

      <section className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded">
        <label className="flex-1 min-w-[200px]">
          <span className="text-xs text-gray-600 block mb-1">Caută email</span>
          <input
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            placeholder="ex. andrei@..."
            className="w-full border rounded px-2 py-1"
          />
        </label>
        <label>
          <span className="text-xs text-gray-600 block mb-1">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded px-2 py-1"
          >
            <option value="">toate</option>
            <option value="pending_payment">în așteptare plată</option>
            <option value="generating">se generează</option>
            <option value="ready">gata</option>
            <option value="failed">eșuat</option>
            <option value="deleted">șters</option>
          </select>
        </label>
        <button
          onClick={() => {
            setPage(1);
            void fetchData();
          }}
          className="bg-black text-white px-4 py-1 rounded"
        >
          Filtrează
        </button>
        <a
          href={csvUrl}
          className="text-sm underline text-gray-700"
          onClick={(e) => {
            // Basic auth download uses fetch + blob pattern since anchor
            // won't forward our header.
            e.preventDefault();
            if (!header) return;
            void (async () => {
              const r = await fetch(csvUrl, { headers: { Authorization: header } });
              if (!r.ok) {
                setActionMsg(`CSV eroare (${r.status}).`);
                return;
              }
              const blob = await r.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "unu-noaptea-orders.csv";
              a.click();
              URL.revokeObjectURL(url);
            })();
          }}
        >
          Export CSV
        </a>
      </section>

      {actionMsg && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          {actionMsg}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Creat</th>
              <th className="p-2">Email</th>
              <th className="p-2">Nume</th>
              <th className="p-2">Status</th>
              <th className="p-2 text-right">€</th>
              <th className="p-2">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Se încarcă...
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Nicio comandă.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-2 whitespace-nowrap">
                  {new Date(o.created_at).toLocaleString("ro-RO")}
                </td>
                <td className="p-2">{o.email}</td>
                <td className="p-2">{o.first_name}</td>
                <td className="p-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs ${
                      STATUS_COLORS[o.status] ?? "bg-gray-100"
                    }`}
                  >
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </td>
                <td className="p-2 text-right">{o.amount_eur.toFixed(2)}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => void resendEmail(o.id)}
                    disabled={o.status !== "ready"}
                    className="text-xs underline disabled:opacity-30"
                  >
                    Retrimite email
                  </button>
                  <button
                    onClick={() => void regenerate(o.id)}
                    disabled={o.status === "deleted"}
                    className="text-xs underline disabled:opacity-30"
                  >
                    Regenerează
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="flex items-center justify-between text-sm">
        <div>
          Pagină {page} din {Math.max(1, Math.ceil(total / 20))} ({total} total)
        </div>
        <div className="space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-30"
          >
            ←
          </button>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-30"
          >
            →
          </button>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-4 bg-white border rounded">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-serif mt-1">{value}</div>
    </div>
  );
}
