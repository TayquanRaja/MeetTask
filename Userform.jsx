import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errMsg } from "../api";
import {
  Btn,
  Card,
  ErrorBox,
  Loading,
  PageHeader,
  inputCls,
} from "../components/ui";
import { DEPARTMENTS, OTHER, PHONE_LENGTH, cleanPhone } from "../constants";

const L = ({ children, required }) => (
  <label className="mb-1 block text-sm font-medium text-slate-700">
    {children}
    {required && <span className="ml-0.5 text-red-500">*</span>}
  </label>
);

const empty = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "EMPLOYEE",
  department: "",
  department_other: "",
  is_active: true,
  can_create_meetings: false,
};

// Default meeting access by role: only managers, unless an admin changes it.
const roleDefault = (role) => role === "MANAGER";

export default function UserForm() {
  const { id } = useParams();
  const edit = !!id;
  const nav = useNavigate();
  const [f, setF] = useState(empty);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(edit);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [accessTouched, setAccessTouched] = useState(false);

  useEffect(() => {
    if (!edit) return;
    api
      .get(`/users/${id}/`)
      .then(({ data: u }) => {
        if (u.role === "ADMIN") {
          nav("/users", { replace: true });
          return;
        }
        const listed = !u.department || DEPARTMENTS.includes(u.department);
        setF({
          username: u.username,
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          email: u.email || "",
          phone: u.phone || "",
          role: u.role,
          department: listed ? u.department || "" : OTHER,
          department_other: listed ? "" : u.department,
          is_active: u.is_active,
          can_create_meetings: !!u.can_create_meetings,
        });
        setAccessTouched(true);
      })
      .catch((e) => setErr(errMsg(e)))
      .finally(() => setLoading(false));
  }, [id, edit, nav]);

  // Live username preview while creating (the server generates the final one)
  useEffect(() => {
    if (edit) return;
    if (!f.first_name.trim() || !f.last_name.trim()) {
      setPreview("");
      return;
    }
    const t = setTimeout(() => {
      api
        .get("/users/next-username/", {
          params: { first_name: f.first_name, last_name: f.last_name },
        })
        .then((r) => setPreview(r.data.username || ""))
        .catch(() => setPreview(""));
    }, 300);
    return () => clearTimeout(t);
  }, [edit, f.first_name, f.last_name]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  // Changing the role resets meeting access to that role's default, unless the admin set it by hand
  const setRole = (e) => {
    const role = e.target.value;
    setF({
      ...f,
      role,
      can_create_meetings: accessTouched
        ? f.can_create_meetings
        : roleDefault(role),
    });
  };
  const department =
    f.department === OTHER ? f.department_other.trim() : f.department;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!f.first_name.trim() || !f.last_name.trim())
      return setErr("First and last name are required.");
    if (!f.email.trim())
      return setErr(
        "Work email is required. The login details are sent there.",
      );
    if (f.phone && f.phone.length !== PHONE_LENGTH)
      return setErr(`Phone number must be exactly ${PHONE_LENGTH} digits.`);
    if (!department) return setErr("Please select a department.");

    const body = {
      first_name: f.first_name.trim(),
      last_name: f.last_name.trim(),
      email: f.email.trim(),
      phone: f.phone,
      department,
      role: f.role,
      can_create_meetings: accessTouched
        ? f.can_create_meetings
        : roleDefault(f.role),
    };

    setBusy(true);
    try {
      if (edit) {
        await api.patch(`/users/${id}/`, { ...body, is_active: f.is_active });
        nav("/users", { state: { notice: { msg: "User updated." } } });
      } else {
        const { data } = await api.post("/users/", body);
        nav("/users", {
          state: {
            notice: data.email_sent
              ? {
                  msg: `User created with username "${data.username}". Login details were emailed to ${data.email}.`,
                }
              : {
                  tone: "amber",
                  msg: `User created with username "${data.username}", but the email could not be sent to ${data.email}. Once email is working, the user can use "Forgot password?" on the sign-in page to get access.`,
                },
          },
        });
      }
    } catch (ex) {
      setErr(errMsg(ex));
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/users" className="text-sm text-brand hover:underline">
        ← Back to users
      </Link>
      <PageHeader
        title={edit ? "Edit user" : "Create new user"}
        subtitle={
          edit
            ? `Update details for @${f.username}.`
            : "Fill in the details below to create an account."
        }
      />

      <form onSubmit={submit} className="space-y-6">
        <ErrorBox msg={err} />

        <Card title="Personal details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <L required>First name</L>
              <input
                className={inputCls}
                value={f.first_name}
                onChange={set("first_name")}
              />
            </div>
            <div>
              <L required>Last name</L>
              <input
                className={inputCls}
                value={f.last_name}
                onChange={set("last_name")}
              />
            </div>
            <div>
              <L required>Work email</L>
              <input
                type="email"
                className={inputCls}
                value={f.email}
                onChange={set("email")}
                placeholder="name@company.com"
              />
            </div>
            <div>
              <L>Phone</L>
              <input
                type="tel"
                inputMode="numeric"
                className={inputCls}
                value={f.phone}
                onChange={(e) =>
                  setF({ ...f, phone: cleanPhone(e.target.value) })
                }
                maxLength={PHONE_LENGTH}
                placeholder="03001234567"
              />
              <p className="mt-1 text-xs text-slate-400">
                Digits only · {f.phone.length}/{PHONE_LENGTH}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Work details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <L required>Department</L>
              <select
                className={inputCls}
                value={f.department}
                onChange={set("department")}
              >
                <option value="">Select department…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value={OTHER}>Other…</option>
              </select>
            </div>
            <div>
              <L required>Role</L>
              <select className={inputCls} value={f.role} onChange={setRole}>
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
            {f.department === OTHER && (
              <div className="sm:col-span-2">
                <L required>Department name</L>
                <input
                  className={inputCls}
                  value={f.department_other}
                  onChange={set("department_other")}
                  placeholder="Enter department"
                />
              </div>
            )}
          </div>
        </Card>

        <Card title="Permissions">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={
                accessTouched ? f.can_create_meetings : roleDefault(f.role)
              }
              onChange={(e) => {
                setAccessTouched(true);
                setF({ ...f, can_create_meetings: e.target.checked });
              }}
            />
            <span>
              <span className="font-medium">Can create meetings</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Managers have this by default. Tick it to let an employee create
                meetings too, or untick it to remove it from a manager.
              </span>
            </span>
          </label>
        </Card>

        <Card title="Account">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <L>Username</L>
              <input
                className={`${inputCls} bg-slate-50 font-mono`}
                value={edit ? f.username : preview}
                placeholder={edit ? "" : "Appears once you enter the name"}
                disabled
                readOnly
              />
            </div>
            {edit && (
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={f.is_active}
                  onChange={(e) => setF({ ...f, is_active: e.target.checked })}
                />
                Account active
              </label>
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Btn
            variant="secondary"
            type="button"
            onClick={() => nav("/users")}
            disabled={busy}
          >
            Cancel
          </Btn>
          <Btn type="submit" disabled={busy}>
            {busy
              ? "Saving..."
              : edit
                ? "Save changes"
                : "Create user & send login"}
          </Btn>
        </div>
      </form>
    </div>
  );
}
