"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateOwnProfile } from "../actions";
import { AGAMA_OPTIONS } from "@/lib/locations";

export type StaffProfile = {
  id: number;
  username: string;
  nickname: string;
  domisili: string | null;
  no_telpon: string | null;
  agama: string | null;
  email: string | null;
  role: "Admin" | "Staff";
};

export default function ProfileClient({ profile, domisiliKalsel }: {
  profile: StaffProfile;
  domisiliKalsel: string[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "danger"; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setFeedback(null);
    const result = await updateOwnProfile(new FormData(form));
    setSaving(false);
    if (!result.success) {
      setFeedback({ type: "danger", message: result.message });
      return;
    }
    setFeedback({ type: "success", message: "Profil berhasil diperbarui." });
    form.reset();
    router.refresh();
  }

  const initials = profile.nickname.slice(0, 2).toUpperCase();

  return (
    <div className="settings-page">
      <div className="settings-hero">
        <div className="settings-hero-icon"><i className="bi bi-gear-fill" /></div>
        <div>
          <span className="settings-eyebrow">AKUN SAYA</span>
          <h3>Setelan Profil</h3>
          <p>Perbarui informasi kontak dan keamanan akun Anda.</p>
        </div>
      </div>

      <div className="row g-4 align-items-start">
        <div className="col-lg-4">
          <div className="panel settings-profile-card">
            <div className="panel-body p-4">
              <div className="settings-avatar">{initials}</div>
              <div className="text-center mb-4">
                <h4 className="fw-bold text-dark mb-1">{profile.nickname}</h4>
                <p className="text-muted mb-2">@{profile.username}</p>
                <span className={`badge-status ${profile.role === "Admin" ? "badge-siap-pameran" : "badge-naik-kelas"}`}>
                  {profile.role}
                </span>
              </div>
              <div className="settings-profile-list">
                <div><i className="bi bi-geo-alt" /><span><small>Domisili</small>{profile.domisili || "Belum diisi"}</span></div>
                <div><i className="bi bi-telephone" /><span><small>Telepon</small>{profile.no_telpon || "Belum diisi"}</span></div>
                <div><i className="bi bi-envelope" /><span><small>Email</small>{profile.email || "Belum diisi"}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="panel settings-form-card">
            <div className="panel-header">
              <div>
                <h5><i className="bi bi-person-lines-fill me-2" />Informasi Profil</h5>
                <p className="text-muted fs-sm mb-0 mt-1">Username dan role hanya dapat diubah oleh Admin.</p>
              </div>
            </div>
            <div className="panel-body p-4">
              {feedback && <div className={`alert alert-${feedback.type}`} role="alert">{feedback.message}</div>}
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6 form-group-custom">
                    <label>Username</label>
                    <input className="form-control form-control-custom" value={profile.username} disabled />
                  </div>
                  <div className="col-md-6 form-group-custom">
                    <label>Nama Tampilan</label>
                    <input name="nickname" className="form-control form-control-custom" defaultValue={profile.nickname} required />
                  </div>
                  <div className="col-md-6 form-group-custom">
                    <label>Domisili</label>
                    <select name="domisili" className="form-control form-control-custom" defaultValue={profile.domisili || ""}>
                      <option value="">Pilih domisili</option>
                      {domisiliKalsel.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 form-group-custom">
                    <label>Agama</label>
                    <select name="agama" className="form-control form-control-custom" defaultValue={profile.agama || ""}>
                      <option value="">Pilih agama</option>
                      {AGAMA_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 form-group-custom">
                    <label>No. Telepon</label>
                    <input name="no_telpon" className="form-control form-control-custom" defaultValue={profile.no_telpon || ""} placeholder="08xxxxxxxxxx" />
                  </div>
                  <div className="col-md-6 form-group-custom">
                    <label>Email</label>
                    <input type="email" name="email" className="form-control form-control-custom" defaultValue={profile.email || ""} placeholder="nama@email.com" />
                  </div>
                  <div className="col-12 form-group-custom">
                    <label>Password Baru <span className="text-muted fw-normal">(opsional)</span></label>
                    <input type="password" name="password" className="form-control form-control-custom" minLength={6} autoComplete="new-password" placeholder="Kosongkan jika tidak ingin mengganti password" />
                  </div>
                </div>
                <div className="settings-form-footer">
                  <span><i className="bi bi-shield-check me-1" /> Perubahan diproses melalui koneksi aman.</span>
                  <button className="btn-primary-custom" type="submit" disabled={saving}>
                    <i className={`bi ${saving ? "bi-arrow-repeat" : "bi-check-lg"} me-2`} />
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
