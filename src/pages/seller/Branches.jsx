        setSelectedBranch((current) => current ? { ...current, is_active: nextActive } : current);
      }
      await loadBranches();
    } catch (err) {
      setError(messageFromError(err, "Unable to update branch status."));
    } finally {
      setBusyBranchId(null);
    }
  }

  return (
    <div className="md-branches">
      <style>{styles}</style>
      <div className="mb-header">
        <div>
          <h1>Branches</h1>
          <p className="mb-subtitle">Manage your business locations and their details.</p>
        </div>
        <button className="mb-btn mb-primary" onClick={openCreate}>+ Add Branch</button>
      </div>

      {error && <div className="mb-alert mb-error" role="alert">{error}</div>}
      {notice && <div className="mb-alert mb-success" role="status">{notice}</div>}

      <div className="mb-stats">
        <div className="mb-stat"><div className="mb-stat-label">Total branches</div><div className="mb-stat-value">{stats.total}</div></div>
        <div className="mb-stat"><div className="mb-stat-label">Active branches</div><div className="mb-stat-value">{stats.active}</div></div>
        <div className="mb-stat"><div className="mb-stat-label">Inactive branches</div><div className="mb-stat-value">{stats.inactive}</div></div>
      </div>

      <div className="mb-toolbar">
        <input className="mb-input mb-search" placeholder="Search branch name, phone or address..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="mb-input mb-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="mb-btn" onClick={() => downloadCSV(filteredBranches)} disabled={!filteredBranches.length}>↓ Export CSV</button>
        <button className="mb-btn" onClick={loadBranches} disabled={loading}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className="mb-empty"><p>Loading your branches…</p></div>
      ) : filteredBranches.length === 0 ? (
        <div className="mb-empty">
          <div className="mb-empty-icon">🏬</div>
          <h3>{branches.length === 0 ? "No branches found" : "No matching branches"}</h3>
          <p>{branches.length === 0 ? "Your Main Branch is created during business registration. Add another location whenever your business expands." : "Try another search term or change the status filter."}</p>
          {branches.length === 0 && <button className="mb-btn mb-primary" onClick={openCreate}>+ Add Branch</button>}
        </div>
      ) : (
        <div className="mb-grid">
          {filteredBranches.map((branch) => (
            <div className="mb-card" key={branch.id}>
              <div className="mb-card-top">
                <div className="mb-card-icon">🏬</div>
                <span className={`mb-badge ${branch.is_active ? "mb-active" : "mb-inactive"}`}>{branch.is_active ? "Active" : "Inactive"}</span>
              </div>
              <h3>{branch.name}</h3>
              <div className="mb-code">{branch.is_main ? "Main Branch" : "Business Branch"}</div>
              <div className="mb-info">
                <div className="mb-info-row"><span className="mb-info-label">Address</span><span className="mb-info-value">{branch.address || "Not provided"}</span></div>
                <div className="mb-info-row"><span className="mb-info-label">Phone</span><span className="mb-info-value">{branch.phone || "—"}</span></div>
                <div className="mb-info-row"><span className="mb-info-label">Created</span><span className="mb-info-value">{formatDate(branch.created_at)}</span></div>
              </div>
              <div className="mb-card-actions">
                <button className="mb-btn" onClick={() => { setSelectedBranch(branch); setModal("details"); }}>View</button>
                <button className="mb-btn" onClick={() => openEdit(branch)}>Edit</button>
                <button className={`mb-btn ${branch.is_active ? "mb-danger" : ""}`} disabled={busyBranchId === branch.id || branch.is_main} title={branch.is_main ? "The Main Branch cannot be deactivated" : ""} onClick={() => toggleStatus(branch)}>
                  {busyBranchId === branch.id ? "Saving…" : branch.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="mb-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModal(null); }}>
          <div className="mb-modal" role="dialog" aria-modal="true">
            <div className="mb-modal-header">
              <h2>{modal === "details" ? "Branch details" : selectedBranch ? "Edit branch" : "Add branch"}</h2>
              <button className="mb-close" onClick={() => setModal(null)} aria-label="Close">×</button>
            </div>

            {modal === "details" && selectedBranch ? (
              <>
                <div className="mb-detail-grid">
                  <div><div className="mb-detail-label">Branch name</div><div className="mb-detail-value">{selectedBranch.name}</div></div>
                  <div><div className="mb-detail-label">Branch type</div><div className="mb-detail-value">{selectedBranch.is_main ? "Main Branch" : "Additional Branch"}</div></div>
                  <div><div className="mb-detail-label">Status</div><div className="mb-detail-value">{selectedBranch.is_active ? "Active" : "Inactive"}</div></div>
                  <div><div className="mb-detail-label">Phone</div><div className="mb-detail-value">{selectedBranch.phone || "—"}</div></div>
                  <div className="mb-full"><div className="mb-detail-label">Address</div><div className="mb-detail-value">{selectedBranch.address || "—"}</div></div>
                  <div><div className="mb-detail-label">Date created</div><div className="mb-detail-value">{formatDate(selectedBranch.created_at)}</div></div>
                </div>
                <div className="mb-modal-footer">
                  <button className="mb-btn" onClick={() => setModal(null)}>Close</button>
                  <button className="mb-btn mb-primary" onClick={() => openEdit(selectedBranch)}>Edit branch</button>
                </div>
              </>
            ) : (
              <form onSubmit={saveBranch}>
                <div className="mb-form-grid">
                  <div className="mb-field mb-full">
                    <label htmlFor="branch-name">Branch name *</label>
                    <input id="branch-name" className="mb-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={150} required autoFocus />
                  </div>
                  <div className="mb-field">
                    <label htmlFor="branch-phone">Phone number</label>
                    <input id="branch-phone" className="mb-input" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} maxLength={30} />
                  </div>
                  <div className="mb-field mb-full">
                    <label htmlFor="branch-address">Address / Location</label>
                    <textarea id="branch-address" className="mb-textarea" rows={3} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
                  </div>
                </div>
                {error && <div className="mb-alert mb-error" style={{ marginTop: 16 }}>{error}</div>}
                <div className="mb-modal-footer">
                  <button type="button" className="mb-btn" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
                  <button type="submit" className="mb-btn mb-primary" disabled={saving}>{saving ? "Saving…" : selectedBranch ? "Save changes" : "Create branch"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
