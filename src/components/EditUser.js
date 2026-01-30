import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import "./EditUser.css";

const DEFAULT_API_BASE = "http://127.0.0.1:5001";

export default function EditUser({ userInfo, onBack, onSaved, apiBaseUrl }) {
  const fileInputRef = useRef(null);

  const API_BASE_URL = useMemo(() => {
    return (
      apiBaseUrl ||
      process.env.REACT_APP_API_BASE_URL ||
      DEFAULT_API_BASE
    );
  }, [apiBaseUrl]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    dob: "",
  });

  const [initialData, setInitialData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!userInfo) return;

    const next = {
      firstName: userInfo.first_name || "",
      lastName: userInfo.last_name || "",
      username: userInfo.username || "",
      dob: userInfo.dob || "",
    };

    setFormData(next);
    setInitialData(next);
    setSelectedFile(null);
    setPreviewImage(null);
    setErrorMsg("");
  }, [userInfo]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        try { URL.revokeObjectURL(previewImage); } catch (_) {}
      }
    };
  }, [previewImage]);

  const isDirty = () => {
    if (!initialData) return false;

    const changed =
      (formData.firstName || "") !== (initialData.firstName || "") ||
      (formData.lastName || "") !== (initialData.lastName || "") ||
      (formData.username || "") !== (initialData.username || "") ||
      (formData.dob || "") !== (initialData.dob || "");

    return changed || !!selectedFile;
  };

  const profileSrc = previewImage
    ? previewImage
    : `${API_BASE_URL}/static/profile_pics/${userInfo?.image_file || "default.jpg"}`;

  const handleProfilePicClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional sanity check: only allow images
    if (!file.type?.startsWith("image/")) {
      setErrorMsg("Please select an image file.");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    setErrorMsg("");
  };

  const handleSave = async () => {
    if (!isDirty() || isSaving) return;

    const email = localStorage.getItem("current_email");
    if (!email) {
      setErrorMsg("No email found in localStorage (current_email). Please log in again.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const payload = new FormData();
      payload.append("email", email);

      payload.append("username", formData.username || "");
      payload.append("dob", formData.dob || "");
      payload.append("first_name", formData.firstName || "");
      payload.append("last_name", formData.lastName || "");

      if (selectedFile) payload.append("profile_photo", selectedFile);

      const res = await fetch(`${API_BASE_URL}/api/update_profile`, {
        method: "POST",
        body: payload,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.error ||
          data?.message ||
          "Profile update failed. Check console for details.";
        console.error("Profile update failed:", data);
        setErrorMsg(msg);
        return;
      }

      if (typeof onSaved === "function") await onSaved();
      if (typeof onBack === "function") onBack();
    } catch (err) {
      console.error("Failed to save profile:", err);
      setErrorMsg("Something went wrong while saving. Check your backend and network tab.");
    } finally {
      setIsSaving(false);
    }
  };

  const onChange = (key) => (e) => {
    const value = e?.target?.value ?? "";
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="dashboard-panel fade-in">
      <div className="edit-user-container">
        <div className="edit-user-header">
          <button className="edit-user-nav-btn" onClick={onBack} aria-label="Back">
            <ArrowLeft size={24} />
          </button>

          <h2 className="edit-user-title">Edit Profile</h2>

          <button
            className={`edit-user-nav-btn save ${(!isDirty() || isSaving) ? "disabled" : ""}`}
            onClick={handleSave}
            disabled={!isDirty() || isSaving}
            aria-disabled={!isDirty() || isSaving}
            title={!isDirty() ? "No changes to save" : "Save changes"}
            aria-label="Save"
          >
            <Check size={24} />
          </button>
        </div>

        <div className="edit-user-content">
          <div className="edit-user-pic-section">
            <div
              className="edit-user-pic-wrapper clickable"
              onClick={handleProfilePicClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleProfilePicClick();
              }}
            >
              <img
                src={profileSrc}
                alt="Profile"
                className="edit-user-pic-img"
                onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/150"; }}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="edit-user-file-input"
                onChange={handleFileChange}
              />
            </div>

            <p className="edit-user-pic-hint">Tap to change photo</p>
          </div>

          {errorMsg ? (
            <div className="edit-user-error" role="alert">
              {errorMsg}
            </div>
          ) : null}

          <div className="edit-user-fields">
            <div className="form-row">
              <div className="places-airport-field">
                <div className="places-field-label">First Name</div>
                <div className={`places-input-wrap ${focusedField === "firstName" ? "focused" : ""}`}>
                  <input
                    className="places-airport-input"
                    value={formData.firstName}
                    onChange={onChange("firstName")}
                    onFocus={() => setFocusedField("firstName")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                </div>
              </div>

              <div className="places-airport-field">
                <div className="places-field-label">Last Name</div>
                <div className={`places-input-wrap ${focusedField === "lastName" ? "focused" : ""}`}>
                  <input
                    className="places-airport-input"
                    value={formData.lastName}
                    onChange={onChange("lastName")}
                    onFocus={() => setFocusedField("lastName")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                </div>
              </div>
            </div>

            <div className="form-row single">
              <div className="places-airport-field">
                <div className="places-field-label">Username</div>
                <div className={`places-input-wrap ${focusedField === "username" ? "focused" : ""}`}>
                  <input
                    className="places-airport-input"
                    value={formData.username}
                    onChange={onChange("username")}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Username"
                    autoComplete="username"
                  />
                </div>
              </div>
            </div>

            <div className="form-row single">
              <div className="places-airport-field">
                <div className="places-field-label">Date of Birth</div>
                <div className={`places-input-wrap ${focusedField === "dob" ? "focused" : ""}`}>
                  <input
                    className="places-airport-input"
                    value={formData.dob}
                    onChange={onChange("dob")}
                    onFocus={() => setFocusedField("dob")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="MM/DD/YYYY"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>

            <div className="edit-user-footnote">
              <span>Save is enabled only when something changes.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
