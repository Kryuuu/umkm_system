"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createFasilitator,
  deleteFasilitator,
  updateStaff,
  updateStaffPermissions,
} from "./actions";
import { AGAMA_OPTIONS } from "@/lib/locations";
import { STAFF_PERMISSIONS, type StaffPermission } from "@/lib/permissions";

export type StaffAccount = {
  id: number;
  username: string;
  nickname: string;
  domisili: string | null;
  no_telpon: string | null;
  agama: string | null;
  email: string | null;
  role: "Admin" | "Staff";
  permissions: StaffPermission[];
  created_at: string | null;
};

type ModalState =
  | { type: "add" }
  | { type: "edit"; staff: StaffAccount }
  | { type: "access"; staff: StaffAccount }
  | null;

function StaffFormFields({ staff, domisiliKalsel, includePassword = true }: {
  staff?: StaffAccount;
  domisiliKalsel: string[];
  includePassword?: boolean;
}) {
  return (
    <div className="row g-3">
      <div className="col-md-6 form-group-custom">
        <label>Username</label>
        <input name="username" className="form-control form-control-custom" defaultValue={staff?.username || ""} required autoComplete="off" />
      </div>
      <div className="col-md-6 form-group-custom">
        <label>Nama Tampilan</label>
        <input name="nickname" className="form-control form-control-custom" defaultValue={staff?.nickname || ""} required />
      </div>
      <div className="col-md-6 form-group-custom">
        <label>Role</label>
        <select name="role" className="form-control form-control-custom" defaultValue={staff?.role || "Staff"}>
          <option value="Staff">Staff</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
      <div className="col-md-6 form-group-custom">
        <label>Domisili</label>
        <select name="domisili" className="form-control form-control-custom" defaultValue={staff?.domisili || ""}>
          <option value="">Pilih domisili</option>
          {domisiliKalsel.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div className="col-md-6 form-group-custom">
        <label>No. Telepon</label>
        <input name="no_telpon" className="form-control form-control-custom" defaultValue={staff?.no_telpon || ""} placeholder="08xxxxxxxxxx" />
      </div>
      <div className="col-md-6 form-group-custom">
        <label>Email</label>
        <input type="email" name="email" className="form-control form-control-custom" defaultValue={staff?.email || ""} placeholder="nama@email.com" />
      </div>
      <div className="col-md-6 form-group-custom">
        <label>Agama</label>
        <select name="agama" className="form-control form-control-custom" defaultValue={staff?.agama || ""}>
          <option value="">Pilih agama</option>
          {AGAMA_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      {includePassword && (
        <div className="col-md-6 form-group-custom">
          <label>{staff ? "Password Baru (opsional)" : "Password"}</label>
          <input type="password" name="password" minLength={6} className="form-control form-control-custom" required={!staff} autoComplete="new-password" placeholder="Minimal 6 karakter" />
        </div>
      )}
    </div>
  );
}

export default function FasilClient({ staff, currentUserId, domisiliKalsel, permissionsReady }: {
  staff: StaffAccount[];
  currentUserId: number;
  domisiliKalsel: string[];
  permissionsReady: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<StaffPermission[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "danger"; message: string } | null>(null);

  const filteredStaff = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return staff;
    return staff.filter((item) => [item.username, item.nickname, item.email, item.domisili, item.role]
      .some((value) => value?.toLowerCase().includes(keyword)));
  }, [query, staff]);

  const admins = staff.filter((item) => item.role === "Admin").length;
  const restricted = staff.filter((item) => item.role === "Staff" && item.permissions.length < STAFF_PERMISSIONS.length).length;

  function showNotice(type: "success" | "danger", message: string) {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 4500);
  }

  function openAccess(staffAccount: StaffAccount) {
    setSelectedPermissions([...staffAccount.permissions]);
    setModal({ type: "access", staff: staffAccount });
  }

  function togglePermission(permission: StaffPermission) {
    setSelectedPermissions((current) => current.includes(permission)
      ? current.filter((item) => item !== permission)
      : [...current, permission]);
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    const result = await createFasilitator(new FormData(form));
    setBusy(false);
    if (!result.success) return showNotice("danger", result.message);
    setModal(null);
    showNotice("success", "Akun staff berhasil ditambahkan.");
    router.refresh();
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    const result = await updateStaff(new FormData(form));
    setBusy(false);
    if (!result.success) return showNotice("danger", result.message);
    setModal(null);
    showNotice("success", "Data staff berhasil diperbarui.");
    router.refresh();
  }

  async function saveAccess() {
    if (modal?.type !== "access") return;
    setBusy(true);
    const result = await updateStaffPermissions(modal.staff.id, selectedPermissions);
    setBusy(false);
    if (!result.success) return showNotice("danger", result.message);
    setModal(null);
    showNotice("success", `Hak akses ${modal.staff.nickname} berhasil diperbarui.`);
    router.refresh();
  }

  async function removeStaff(staffAccount: StaffAccount) {
    if (!window.confirm(`Hapus akun ${staffAccount.nickname}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBusy(true);
    const result = await deleteFasilitator(staffAccount.id);
    setBusy(false);
    if (!result.success) return showNotice("danger", result.message);
    showNotice("success", "Akun staff berhasil dihapus.");
    router.refresh();
  }

  return (
    <div className="staff-page">
      {notice && <div className={`staff-toast staff-toast-${notice.type}`}><i className={`bi ${notice.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"}`} />{notice.message}</div>}

      <div className="staff-hero">
        <div>
          <span className="settings-eyebrow">MANAJEMEN PENGGUNA</span>
          <h3>Data Pengguna</h3>
          <p>Kelola akun, informasi profil, dan batas akses setiap anggota tim.</p>
        </div>
        <button className="btn-primary-custom" onClick={() => setModal({ type: "add" })}>
          <i className="bi bi-person-plus-fill me-2" />Tambah Pengguna
        </button>
      </div>

      {!permissionsReady && (
        <div className="alert alert-warning d-flex align-items-start gap-2" role="alert">
          <i className="bi bi-database-fill mt-1" />
          <div><strong>Aktifkan penyimpanan hak akses.</strong><br /><span className="fs-sm">Jalankan bagian hak akses pada file <code>migration.sql</code> di Supabase SQL Editor. Pengelolaan data pengguna lainnya tetap dapat digunakan.</span></div>
        </div>
      )}

      <div className="row g-3 mb-4">
        {[
          { label: "Total Akun", value: staff.length, icon: "bi-people-fill", tone: "primary" },
          { label: "Administrator", value: admins, icon: "bi-shield-lock-fill", tone: "success" },
          { label: "Pengguna Aktif", value: staff.length - admins, icon: "bi-person-badge-fill", tone: "info" },
          { label: "Akses Terbatas", value: restricted, icon: "bi-shield-exclamation", tone: "warning" },
        ].map((item) => (
          <div className="col-6 col-xl-3" key={item.label}>
            <div className={`staff-stat staff-stat-${item.tone}`}>
              <span><i className={`bi ${item.icon}`} /></span>
              <div><strong>{item.value}</strong><small>{item.label}</small></div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel staff-list-panel">
        <div className="panel-header staff-list-header">
          <div>
            <h5><i className="bi bi-people me-2" />Daftar Akun</h5>
            <p className="text-muted fs-sm mb-0 mt-1">{filteredStaff.length} dari {staff.length} akun ditampilkan</p>
          </div>
          <div className="staff-search">
            <i className="bi bi-search" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari staff..." aria-label="Cari staff" />
          </div>
        </div>
        <div className="panel-body p-0">
          <div className="table-responsive">
            <table className="table-custom staff-table">
              <thead><tr><th>Pengguna</th><th>Kontak</th><th>Domisili</th><th>Role</th><th>Akses Modul</th><th className="text-end">Aksi</th></tr></thead>
              <tbody>
                {filteredStaff.map((item) => {
                  const accessCount = item.role === "Admin" ? STAFF_PERMISSIONS.length : item.permissions.length;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="staff-identity">
                          <span>{item.nickname.slice(0, 2).toUpperCase()}</span>
                          <div><strong>{item.nickname}</strong><small>@{item.username}</small></div>
                        </div>
                      </td>
                      <td><strong className="d-block fs-sm">{item.email || "-"}</strong><small className="text-muted">{item.no_telpon || "Belum ada telepon"}</small></td>
                      <td>{item.domisili || "-"}</td>
                      <td><span className={`staff-role staff-role-${item.role.toLowerCase()}`}><i className={`bi ${item.role === "Admin" ? "bi-shield-fill-check" : "bi-person-fill"}`} />{item.role}</span></td>
                      <td>
                        <div className="staff-access-count">
                          <span>{accessCount}/{STAFF_PERMISSIONS.length} modul</span>
                          <div><i style={{ width: `${(accessCount / STAFF_PERMISSIONS.length) * 100}%` }} /></div>
                        </div>
                      </td>
                      <td>
                        <div className="staff-actions">
                          <button title="Edit data" onClick={() => setModal({ type: "edit", staff: item })}><i className="bi bi-pencil-square" /></button>
                          {item.role === "Staff" && <button title={permissionsReady ? "Atur hak akses" : "Jalankan migrasi database terlebih dahulu"} className="access" disabled={!permissionsReady} onClick={() => openAccess(item)}><i className="bi bi-shield-check" /></button>}
                          {item.id !== currentUserId && <button title="Hapus akun" className="danger" disabled={busy} onClick={() => removeStaff(item)}><i className="bi bi-trash3" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStaff.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-5">Tidak ada pengguna yang cocok dengan pencarian.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className="staff-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setModal(null); }}>
          <div className={`staff-modal ${modal.type === "access" ? "staff-modal-access" : ""}`} role="dialog" aria-modal="true">
            <div className="staff-modal-header">
              <div className="staff-modal-icon"><i className={`bi ${modal.type === "add" ? "bi-person-plus-fill" : modal.type === "edit" ? "bi-pencil-square" : "bi-shield-lock-fill"}`} /></div>
              <div>
                <h5>{modal.type === "add" ? "Tambah Pengguna Baru" : modal.type === "edit" ? "Edit Data Pengguna" : "Atur Hak Akses"}</h5>
                <p>{modal.type === "access" ? `Tentukan modul yang dapat digunakan oleh ${modal.staff.nickname}.` : "Lengkapi informasi akun dengan benar."}</p>
              </div>
              <button className="staff-modal-close" onClick={() => setModal(null)} disabled={busy} aria-label="Tutup"><i className="bi bi-x-lg" /></button>
            </div>

            {modal.type === "add" && (
              <form onSubmit={submitCreate}>
                <div className="staff-modal-body">
                  <StaffFormFields domisiliKalsel={domisiliKalsel} />
                  <div className="mt-4">
                    <label className="form-label fw-bold">Akses awal Pengguna</label>
                    <div className="permission-compact-grid">
                      {STAFF_PERMISSIONS.map((permission) => (
                        <label key={permission.key}><input type="checkbox" name="permissions" value={permission.key} defaultChecked /><span><i className={`bi ${permission.icon}`} />{permission.label}</span></label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="staff-modal-footer"><button type="button" className="btn btn-light" onClick={() => setModal(null)}>Batal</button><button className="btn-primary-custom" disabled={busy}>{busy ? "Menyimpan..." : "Tambah Pengguna"}</button></div>
              </form>
            )}

            {modal.type === "edit" && (
              <form onSubmit={submitEdit} key={modal.staff.id}>
                <input type="hidden" name="id" value={modal.staff.id} />
                <div className="staff-modal-body"><StaffFormFields staff={modal.staff} domisiliKalsel={domisiliKalsel} /></div>
                <div className="staff-modal-footer"><button type="button" className="btn btn-light" onClick={() => setModal(null)}>Batal</button><button className="btn-primary-custom" disabled={busy}>{busy ? "Menyimpan..." : "Simpan Perubahan"}</button></div>
              </form>
            )}

            {modal.type === "access" && (
              <>
                <div className="staff-modal-body">
                  <div className="access-select-actions">
                    <span>{selectedPermissions.length} dari {STAFF_PERMISSIONS.length} modul dipilih</span>
                    <div><button onClick={() => setSelectedPermissions(STAFF_PERMISSIONS.map((item) => item.key))}>Pilih Semua</button><button onClick={() => setSelectedPermissions([])}>Kosongkan</button></div>
                  </div>
                  <div className="permission-grid">
                    {STAFF_PERMISSIONS.map((permission) => {
                      const checked = selectedPermissions.includes(permission.key);
                      return (
                        <label key={permission.key} className={checked ? "selected" : ""}>
                          <input type="checkbox" checked={checked} onChange={() => togglePermission(permission.key)} />
                          <span className="permission-icon"><i className={`bi ${permission.icon}`} /></span>
                          <span><strong>{permission.label}</strong><small>{permission.description}</small></span>
                          <i className={`bi ${checked ? "bi-check-circle-fill" : "bi-circle"}`} />
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="staff-modal-footer"><button type="button" className="btn btn-light" onClick={() => setModal(null)}>Batal</button><button className="btn-primary-custom" onClick={saveAccess} disabled={busy}>{busy ? "Menyimpan..." : "Simpan Hak Akses"}</button></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
