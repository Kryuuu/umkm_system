"use client";

import { useState, useMemo, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createScoringRule, updateScoringRule, deleteScoringRule, toggleRuleActive } from "./actions";

type Rule = {
  id: number;
  kategori: string;
  label: string;
  deskripsi: string | null;
  kondisi_min: number;
  kondisi_max: number | null;
  poin: number;
  max_poin: number | null;
  urutan: number;
  is_active: boolean;
  updated_at: string | null;
};

const KATEGORI_OPTIONS = [
  { value: "omzet", label: "Omzet", icon: "bi-cash-stack", color: "#10b981" },
];

function getKategoriMeta(key: string) {
  return KATEGORI_OPTIONS.find(k => k.value === key) || { value: key, label: key, icon: "bi-question-circle", color: "#6b7280" };
}

function formatNumber(n: number | null) {
  if (n == null) return "-";
  return Number(n).toLocaleString("id-ID");
}

export default function ScoringRulesClient({ rules, user, tableReady }: { rules: Rule[]; user: any; tableReady: boolean }) {
  const router = useRouter();
  const [modal, setModal] = useState<{ type: "add" } | { type: "edit"; rule: Rule } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "danger"; msg: string } | null>(null);
  const [filterKategori, setFilterKategori] = useState("all");

  const grouped = useMemo(() => {
    const map: Record<string, Rule[]> = {};
    for (const r of rules) {
      if (!map[r.kategori]) map[r.kategori] = [];
      map[r.kategori].push(r);
    }
    return map;
  }, [rules]);

  const filteredRules = useMemo(() => {
    if (filterKategori === "all") return rules;
    return rules.filter(r => r.kategori === filterKategori);
  }, [rules, filterKategori]);

  const totalMaxPoin = useMemo(() => {
    const seen = new Set<string>();
    let total = 0;
    for (const r of rules) {
      if (!seen.has(r.kategori) && r.max_poin) {
        seen.add(r.kategori);
        total += r.max_poin;
      }
    }
    return total;
  }, [rules]);

  const activeCount = rules.filter(r => r.is_active).length;
  const kategoris = Object.keys(grouped);

  function flash(type: "success" | "danger", msg: string) {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 4000);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = modal?.type === "edit"
      ? await updateScoringRule(fd)
      : await createScoringRule(fd);
    setBusy(false);
    if (!res.success) return flash("danger", res.message);
    setModal(null);
    flash("success", modal?.type === "edit" ? "Aturan berhasil diperbarui." : "Aturan baru berhasil ditambahkan.");
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus aturan ini? Tindakan tidak dapat dibatalkan.")) return;
    setBusy(true);
    const res = await deleteScoringRule(id);
    setBusy(false);
    if (!res.success) return flash("danger", res.message);
    flash("success", "Aturan berhasil dihapus.");
    router.refresh();
  }

  async function handleToggle(id: number, current: boolean) {
    setBusy(true);
    const res = await toggleRuleActive(id, !current);
    setBusy(false);
    if (!res.success) return flash("danger", res.message);
    router.refresh();
  }

  return (
    <div className="scoring-rules-page">
      <style>{`
        .scoring-rules-page { animation: fadeInUp 0.4s ease; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        .sr-hero { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
        .sr-hero h3 { font-weight: 800; margin-bottom: 4px; }
        .sr-hero p { color: var(--text-muted); font-size: 0.875rem; margin: 0; }
        .sr-eyebrow { text-transform: uppercase; font-size: 0.65rem; font-weight: 700; letter-spacing: 2px; color: var(--primary); margin-bottom: 6px; }

        .sr-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .sr-stat { padding: 1.25rem; border-radius: 16px; background: var(--card-bg, #fff); border: 1px solid var(--border-color, rgba(0,0,0,0.08)); display: flex; align-items: center; gap: 1rem; transition: all 0.2s; }
        .sr-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
        .sr-stat-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: white; flex-shrink: 0; }
        .sr-stat strong { font-size: 1.5rem; display: block; line-height: 1.2; }
        .sr-stat small { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }

        .sr-filter { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
        .sr-filter-btn { padding: 6px 14px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; border: 1.5px solid var(--border-color, rgba(0,0,0,0.1)); background: transparent; cursor: pointer; transition: all 0.2s; color: var(--text-color); display: flex; align-items: center; gap: 6px; }
        .sr-filter-btn:hover { border-color: var(--primary); color: var(--primary); }
        .sr-filter-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

        .sr-card { border-radius: 16px; background: var(--card-bg, #fff); border: 1px solid var(--border-color, rgba(0,0,0,0.08)); overflow: hidden; margin-bottom: 1rem; transition: all 0.2s; }
        .sr-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .sr-card-header { padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.06)); }
        .sr-card-header-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1rem; flex-shrink: 0; }
        .sr-card-header h6 { margin: 0; font-weight: 700; font-size: 0.9rem; }
        .sr-card-header small { color: var(--text-muted); font-size: 0.7rem; }
        .sr-card-body { padding: 0; }

        .sr-rule-row { display: grid; grid-template-columns: 1fr auto auto auto; align-items: center; gap: 1rem; padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.04)); transition: background 0.15s; }
        .sr-rule-row:hover { background: rgba(0,0,0,0.015); }
        .sr-rule-row:last-child { border-bottom: none; }
        .sr-rule-row.inactive { opacity: 0.45; }
        .sr-rule-label { font-weight: 600; font-size: 0.85rem; }
        .sr-rule-desc { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
        .sr-rule-poin { font-size: 1.1rem; font-weight: 800; color: var(--primary); min-width: 50px; text-align: center; }
        .sr-rule-range { font-size: 0.7rem; color: var(--text-muted); background: rgba(0,0,0,0.03); padding: 3px 10px; border-radius: 99px; white-space: nowrap; }
        .sr-rule-actions { display: flex; gap: 4px; }
        .sr-rule-actions button { width: 30px; height: 30px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; transition: all 0.15s; background: rgba(0,0,0,0.04); color: var(--text-color); }
        .sr-rule-actions button:hover { background: rgba(0,0,0,0.1); }
        .sr-rule-actions button.toggle-active { color: #10b981; }
        .sr-rule-actions button.toggle-inactive { color: #ef4444; }
        .sr-rule-actions button.edit { color: #f59e0b; }
        .sr-rule-actions button.delete { color: #ef4444; }
        .sr-rule-actions button.delete:hover { background: #fee2e2; }

        .sr-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .sr-modal { background: var(--card-bg, #fff); border-radius: 20px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); animation: modalSlide 0.3s ease; }
        @keyframes modalSlide { from { transform: translateY(20px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        .sr-modal-header { padding: 1.5rem; border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.08)); display: flex; justify-content: space-between; align-items: center; }
        .sr-modal-header h5 { margin: 0; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
        .sr-modal-body { padding: 1.5rem; }
        .sr-modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border-color, rgba(0,0,0,0.08)); display: flex; justify-content: flex-end; gap: 0.75rem; }

        .sr-form-group { margin-bottom: 1rem; }
        .sr-form-group label { font-size: 0.78rem; font-weight: 600; margin-bottom: 6px; display: block; color: var(--text-color); }
        .sr-form-group input, .sr-form-group select, .sr-form-group textarea { width: 100%; padding: 10px 14px; border: 1.5px solid var(--border-color, rgba(0,0,0,0.12)); border-radius: 10px; font-size: 0.85rem; background: var(--card-bg, #fff); color: var(--text-color); transition: border-color 0.2s; }
        .sr-form-group input:focus, .sr-form-group select:focus, .sr-form-group textarea:focus { outline: none; border-color: var(--primary); }
        .sr-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        .sr-toast { position: fixed; top: 20px; right: 20px; z-index: 99999; padding: 14px 20px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 8px; animation: slideInRight 0.3s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .sr-toast-success { background: #10b981; color: white; }
        .sr-toast-danger { background: #ef4444; color: white; }
        @keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        .sr-empty { text-align: center; padding: 3rem; color: var(--text-muted); }
        .sr-empty i { font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem; }

        .sr-warning { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; gap: 0.75rem; align-items: flex-start; }
        .sr-warning i { color: #d97706; font-size: 1.25rem; margin-top: 2px; }
        .sr-warning strong { display: block; margin-bottom: 4px; color: #92400e; }
        .sr-warning span { font-size: 0.8rem; color: #78350f; }

        @media (max-width: 768px) {
          .sr-rule-row { grid-template-columns: 1fr; gap: 0.5rem; }
          .sr-form-row { grid-template-columns: 1fr; }
          .sr-hero { flex-direction: column; }
        }

        [data-theme='dark'] .sr-rule-row:hover { background: rgba(255,255,255,0.02); }
        [data-theme='dark'] .sr-rule-range { background: rgba(255,255,255,0.06); }
        [data-theme='dark'] .sr-rule-actions button { background: rgba(255,255,255,0.06); }
        [data-theme='dark'] .sr-warning { background: linear-gradient(135deg, #422006, #78350f); border-color: #b45309; }
        [data-theme='dark'] .sr-warning strong { color: #fde68a; }
        [data-theme='dark'] .sr-warning span { color: #fcd34d; }
      `}</style>

      {notice && (
        <div className={`sr-toast sr-toast-${notice.type}`}>
          <i className={`bi ${notice.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"}`} />
          {notice.msg}
        </div>
      )}

      <div className="sr-hero">
        <div>
          <div className="sr-eyebrow">Konfigurasi Sistem</div>
          <h3>Aturan Skor Leaderboard</h3>
          <p>Kelola bobot penilaian dan aturan poin untuk peringkat UMKM.</p>
        </div>
        <button className="btn-primary-custom" onClick={() => setModal({ type: "add" })} disabled={!tableReady}>
          <i className="bi bi-plus-lg me-2" />Tambah Aturan
        </button>
      </div>

      {!tableReady && (
        <div className="sr-warning">
          <i className="bi bi-exclamation-triangle-fill" />
          <div>
            <strong>Tabel belum dibuat</strong>
            <span>Jalankan file <code>migration-scoring-rules.sql</code> di Supabase SQL Editor untuk mengaktifkan fitur ini.</span>
          </div>
        </div>
      )}

      <div className="sr-stats">
        <div className="sr-stat">
          <div className="sr-stat-icon" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <i className="bi bi-list-check" />
          </div>
          <div><strong>{rules.length}</strong><small>Total Aturan</small></div>
        </div>
        <div className="sr-stat">
          <div className="sr-stat-icon" style={{ background: "linear-gradient(135deg, #10b981, #34d399)" }}>
            <i className="bi bi-check-circle" />
          </div>
          <div><strong>{activeCount}</strong><small>Aturan Aktif</small></div>
        </div>
        <div className="sr-stat">
          <div className="sr-stat-icon" style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}>
            <i className="bi bi-collection" />
          </div>
          <div><strong>{kategoris.length}</strong><small>Kategori</small></div>
        </div>
        <div className="sr-stat">
          <div className="sr-stat-icon" style={{ background: "linear-gradient(135deg, #ef4444, #f87171)" }}>
            <i className="bi bi-trophy" />
          </div>
          <div><strong>{totalMaxPoin}</strong><small>Maks Total Poin</small></div>
        </div>
      </div>

      <div className="sr-filter">
        <button className={`sr-filter-btn ${filterKategori === "all" ? "active" : ""}`} onClick={() => setFilterKategori("all")}>
          <i className="bi bi-grid-3x3-gap" /> Semua
        </button>
        {KATEGORI_OPTIONS.map(k => {
          const count = grouped[k.value]?.length || 0;
          if (count === 0 && filterKategori !== k.value) return null;
          return (
            <button key={k.value} className={`sr-filter-btn ${filterKategori === k.value ? "active" : ""}`} onClick={() => setFilterKategori(k.value)}>
              <i className={`bi ${k.icon}`} /> {k.label} ({count})
            </button>
          );
        })}
      </div>

      {rules.length === 0 && tableReady ? (
        <div className="sr-empty">
          <i className="bi bi-sliders2" />
          <p>Belum ada aturan skor. Klik &quot;Tambah Aturan&quot; untuk memulai.</p>
        </div>
      ) : (
        <>
          {filterKategori === "all" ? (
            kategoris.map(kategori => {
              const meta = getKategoriMeta(kategori);
              const items = grouped[kategori];
              return (
                <div key={kategori} className="sr-card">
                  <div className="sr-card-header">
                    <div className="sr-card-header-icon" style={{ background: meta.color }}>
                      <i className={`bi ${meta.icon}`} />
                    </div>
                    <div>
                      <h6>{meta.label}</h6>
                      <small>{items.length} aturan · Maks {items[0]?.max_poin || "-"} poin</small>
                    </div>
                  </div>
                  <div className="sr-card-body">
                    {items.map(rule => (
                      <RuleRow key={rule.id} rule={rule} onEdit={() => setModal({ type: "edit", rule })} onDelete={() => handleDelete(rule.id)} onToggle={() => handleToggle(rule.id, rule.is_active)} busy={busy} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="sr-card">
              <div className="sr-card-header">
                <div className="sr-card-header-icon" style={{ background: getKategoriMeta(filterKategori).color }}>
                  <i className={`bi ${getKategoriMeta(filterKategori).icon}`} />
                </div>
                <div>
                  <h6>{getKategoriMeta(filterKategori).label}</h6>
                  <small>{filteredRules.length} aturan</small>
                </div>
              </div>
              <div className="sr-card-body">
                {filteredRules.map(rule => (
                  <RuleRow key={rule.id} rule={rule} onEdit={() => setModal({ type: "edit", rule })} onDelete={() => handleDelete(rule.id)} onToggle={() => handleToggle(rule.id, rule.is_active)} busy={busy} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {modal && (
        <div className="sr-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setModal(null); }}>
          <div className="sr-modal">
            <div className="sr-modal-header">
              <h5><i className={`bi ${modal.type === "add" ? "bi-plus-circle-fill" : "bi-pencil-square"}`} /> {modal.type === "add" ? "Tambah Aturan Baru" : "Edit Aturan"}</h5>
              <button className="btn-close" onClick={() => setModal(null)} disabled={busy} />
            </div>
            <form onSubmit={handleSubmit}>
              {modal.type === "edit" && <input type="hidden" name="id" value={modal.rule.id} />}
              {modal.type === "edit" && <input type="hidden" name="is_active" value={String(modal.rule.is_active)} />}
              <div className="sr-modal-body">
                <div className="sr-form-row">
                  <div className="sr-form-group">
                    <label>Kategori</label>
                    <select name="kategori" required defaultValue={modal.type === "edit" ? modal.rule.kategori : ""} disabled={modal.type === "edit"}>
                      <option value="">-- Pilih --</option>
                      {KATEGORI_OPTIONS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                    </select>
                    {modal.type === "edit" && <input type="hidden" name="kategori" value={modal.rule.kategori} />}
                  </div>
                  <div className="sr-form-group">
                    <label>Urutan</label>
                    <input type="number" name="urutan" defaultValue={modal.type === "edit" ? modal.rule.urutan : 0} min={0} />
                  </div>
                </div>
                <div className="sr-form-group">
                  <label>Label</label>
                  <input name="label" required defaultValue={modal.type === "edit" ? modal.rule.label : ""} placeholder="Contoh: Omzet >= Rp 25.000.000" />
                </div>
                <div className="sr-form-group">
                  <label>Deskripsi</label>
                  <textarea name="deskripsi" rows={2} defaultValue={modal.type === "edit" ? modal.rule.deskripsi || "" : ""} placeholder="Penjelasan singkat tentang aturan ini..." />
                </div>
                <div className="sr-form-row">
                  <div className="sr-form-group">
                    <label>Kondisi Min (≥)</label>
                    <input type="number" name="kondisi_min" defaultValue={modal.type === "edit" ? modal.rule.kondisi_min : 0} min={0} />
                  </div>
                  <div className="sr-form-group">
                    <label>Kondisi Max (&lt;) <small style={{fontWeight:400,color:"var(--text-muted)"}}>(kosong = ∞)</small></label>
                    <input type="number" name="kondisi_max" defaultValue={modal.type === "edit" && modal.rule.kondisi_max != null ? modal.rule.kondisi_max : ""} placeholder="Tak terbatas" />
                  </div>
                </div>
                <div className="sr-form-row">
                  <div className="sr-form-group">
                    <label>Poin Diberikan</label>
                    <input type="number" name="poin" required defaultValue={modal.type === "edit" ? modal.rule.poin : 0} min={0} />
                  </div>
                  <div className="sr-form-group">
                    <label>Maks Poin Kategori</label>
                    <input type="number" name="max_poin" defaultValue={modal.type === "edit" && modal.rule.max_poin != null ? modal.rule.max_poin : ""} placeholder="Opsional" />
                  </div>
                </div>
              </div>
              <div className="sr-modal-footer">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setModal(null)} disabled={busy}>Batal</button>
                <button type="submit" className="btn-primary-custom" disabled={busy}>{busy ? "Menyimpan..." : modal.type === "add" ? "Tambah Aturan" : "Simpan Perubahan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RuleRow({ rule, onEdit, onDelete, onToggle, busy }: { rule: Rule; onEdit: () => void; onDelete: () => void; onToggle: () => void; busy: boolean }) {
  const rangeText = rule.kondisi_max != null
    ? `≥ ${formatNumber(rule.kondisi_min)} & < ${formatNumber(rule.kondisi_max)}`
    : `≥ ${formatNumber(rule.kondisi_min)}`;

  return (
    <div className={`sr-rule-row ${!rule.is_active ? "inactive" : ""}`}>
      <div>
        <div className="sr-rule-label">{rule.label}</div>
        {rule.deskripsi && <div className="sr-rule-desc">{rule.deskripsi}</div>}
      </div>
      <span className="sr-rule-range">{rangeText}</span>
      <span className="sr-rule-poin">+{rule.poin}</span>
      <div className="sr-rule-actions">
        <button className={rule.is_active ? "toggle-active" : "toggle-inactive"} onClick={onToggle} disabled={busy} title={rule.is_active ? "Nonaktifkan" : "Aktifkan"}>
          <i className={`bi ${rule.is_active ? "bi-toggle-on" : "bi-toggle-off"}`} />
        </button>
        <button className="edit" onClick={onEdit} title="Edit"><i className="bi bi-pencil" /></button>
        <button className="delete" onClick={onDelete} disabled={busy} title="Hapus"><i className="bi bi-trash3" /></button>
      </div>
    </div>
  );
}
