'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type DurationMode = 'FULL_DAY' | 'HOURLY' | 'BOTH'
type LegalCategory =
  | 'SICK_LEAVE'
  | 'VACATION'
  | 'PERSONAL'
  | 'MEDICAL'
  | 'UNPAID'
  | 'OTHER'

type AbsenceTypeFormValues = {
  id?: string
  code: string
  name: string
  description: string
  displayOrder: number
  isActive: boolean
  durationMode: DurationMode
  requiresApproval: boolean
  isPaid: boolean
  blocksShifts: boolean
  countsAsWorkedTime: boolean
  requiresDocument: boolean
  allowsNotes: boolean
  affectsPayroll: boolean
  color: string
  icon: string
  legalCategory: LegalCategory | ''
}

type Props = {
  mode: 'create' | 'edit'
  initialValues?: Partial<AbsenceTypeFormValues>
}

const defaultValues: AbsenceTypeFormValues = {
  code: '',
  name: '',
  description: '',
  displayOrder: 0,
  isActive: true,
  durationMode: 'FULL_DAY',
  requiresApproval: false,
  isPaid: true,
  blocksShifts: true,
  countsAsWorkedTime: false,
  requiresDocument: false,
  allowsNotes: true,
  affectsPayroll: true,
  color: '',
  icon: '',
  legalCategory: '',
}

function isValidHexColor(value: string) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)
}

export function AbsenceTypeForm({ mode, initialValues }: Props) {
  const router = useRouter()

  const [values, setValues] = useState<AbsenceTypeFormValues>({
    ...defaultValues,
    ...initialValues,
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField<K extends keyof AbsenceTypeFormValues>(
    field: K,
    value: AbsenceTypeFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      code: values.code,
      name: values.name,
      description: values.description || null,
      displayOrder: Number(values.displayOrder),
      isActive: values.isActive,
      durationMode: values.durationMode,
      requiresApproval: values.requiresApproval,
      isPaid: values.isPaid,
      blocksShifts: values.blocksShifts,
      countsAsWorkedTime: values.countsAsWorkedTime,
      requiresDocument: values.requiresDocument,
      allowsNotes: values.allowsNotes,
      affectsPayroll: values.affectsPayroll,
      color: values.color || null,
      icon: values.icon || null,
      legalCategory: values.legalCategory || null,
    }

    try {
      const url =
        mode === 'create'
          ? '/api/absence-types'
          : `/api/absence-types/${values.id}`

      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo guardar el tipo de ausencia.')
      }

      router.push(
        `/maestros/ausencias?${mode === 'create' ? 'created=1' : 'updated=1'}`
      )
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!values.id) return

    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar este tipo de ausencia?'
    )

    if (!confirmed) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/absence-types/${values.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || 'No se pudo eliminar el tipo de ausencia.'
        )
      }

      router.push('/maestros/ausencias?deleted=1')
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ha ocurrido un error inesperado.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-layout">
      {error && (
        <section className="card">
          <p style={{ margin: 0, color: 'var(--color-error)', fontWeight: 700 }}>
            {error}
          </p>
        </section>
      )}

      <section className="form-section">
        <div className="form-section-header">
          <h2 className="form-section-title">Información básica</h2>
          <p className="form-section-text">
            Datos principales del tipo de ausencia.
          </p>
        </div>

        <div className="form-section-body">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="code">Código</label>
              <input
                id="code"
                className="input"
                type="text"
                value={values.code}
                onChange={(e) => setField('code', e.target.value)}
                placeholder="VACATION"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="name">Nombre</label>
              <input
                id="name"
                className="input"
                type="text"
                value={values.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Vacaciones"
                required
              />
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                className="textarea"
                value={values.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Descripción opcional del tipo de ausencia"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-header">
          <h2 className="form-section-title">Configuración</h2>
          <p className="form-section-text">
            Clasificación, orden y representación visual.
          </p>
        </div>

        <div className="form-section-body">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="displayOrder">Orden</label>
              <input
                id="displayOrder"
                className="input"
                type="number"
                min={0}
                value={values.displayOrder}
                onChange={(e) => setField('displayOrder', Number(e.target.value))}
              />
            </div>

            <div className="form-field">
              <label htmlFor="durationMode">Modo de duración</label>
              <select
                id="durationMode"
                className="select"
                value={values.durationMode}
                onChange={(e) =>
                  setField('durationMode', e.target.value as DurationMode)
                }
              >
                <option value="FULL_DAY">Día completo</option>
                <option value="HOURLY">Por horas</option>
                <option value="BOTH">Ambos</option>
              </select>
            </div>

            <div className="form-field form-field-full">
              <label htmlFor="legalCategory">Categoría legal</label>
              <select
                id="legalCategory"
                className="select"
                value={values.legalCategory}
                onChange={(e) =>
                  setField('legalCategory', e.target.value as LegalCategory | '')
                }
              >
                <option value="">Sin categoría</option>
                <option value="SICK_LEAVE">Baja médica</option>
                <option value="VACATION">Vacaciones</option>
                <option value="PERSONAL">Asuntos personales</option>
                <option value="MEDICAL">Médica</option>
                <option value="UNPAID">No retribuida</option>
                <option value="OTHER">Otra</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="color">Color</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <input
                  id="color"
                  className="input"
                  type="text"
                  value={values.color}
                  onChange={(e) => setField('color', e.target.value)}
                  placeholder="#4CAF50"
                />
                <span
                  aria-hidden="true"
                  style={{
                    width: 22,
                    height: 22,
                    flex: '0 0 22px',
                    borderRadius: 999,
                    border: '1px solid var(--color-border)',
                    background:
                      values.color && isValidHexColor(values.color)
                        ? values.color
                        : '#ffffff',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="icon">Icono</label>
              <input
                id="icon"
                className="input"
                type="text"
                value={values.icon}
                onChange={(e) => setField('icon', e.target.value)}
                placeholder="palm-tree"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-header">
          <h2 className="form-section-title">Comportamiento</h2>
          <p className="form-section-text">
            Reglas operativas y efectos de este tipo de ausencia.
          </p>
        </div>

        <div className="form-section-body">
          <div className="form-grid">
            <div className="form-field form-field-checkbox">
              <input
                id="isActive"
                type="checkbox"
                checked={values.isActive}
                onChange={(e) => setField('isActive', e.target.checked)}
              />
              <label htmlFor="isActive">Activa</label>
            </div>

            <div className="form-field form-field-checkbox">
              <input
                id="requiresApproval"
                type="checkbox"
                checked={values.requiresApproval}
                onChange={(e) => setField('requiresApproval', e.target.checked)}
              />
              <label htmlFor="requiresApproval">Requiere aprobación</label>
            </div>

            <div className="form-field form-field-checkbox">
              <input
                id="isPaid"
                type="checkbox"
                checked={values.isPaid}
                onChange={(e) => setField('isPaid', e.target.checked)}
              />
              <label htmlFor="isPaid">Es retribuida</label>
            </div>

            <div className="form-field form-field-checkbox">
              <input
                id="blocksShifts"
                type="checkbox"
                checked={values.blocksShifts}
                onChange={(e) => setField('blocksShifts', e.target.checked)}
              />
              <label htmlFor="blocksShifts">Bloquea turnos</label>
            </div>

            <div className="form-field form-field-checkbox">
              <input
                id="countsAsWorkedTime"
                type="checkbox"
                checked={values.countsAsWorkedTime}
                onChange={(e) => setField('countsAsWorkedTime', e.target.checked)}
              />
              <label htmlFor="countsAsWorkedTime">
                Cuenta como tiempo trabajado
              </label>
            </div>

            <div className="form-field form-field-checkbox">
              <input
                id="requiresDocument"
                type="checkbox"
                checked={values.requiresDocument}
                onChange={(e) => setField('requiresDocument', e.target.checked)}
              />
              <label htmlFor="requiresDocument">Requiere documento</label>
            </div>

            <div className="form-field form-field-checkbox">
              <input
                id="allowsNotes"
                type="checkbox"
                checked={values.allowsNotes}
                onChange={(e) => setField('allowsNotes', e.target.checked)}
              />
              <label htmlFor="allowsNotes">Permite notas</label>
            </div>

            <div className="form-field form-field-checkbox">
              <input
                id="affectsPayroll"
                type="checkbox"
                checked={values.affectsPayroll}
                onChange={(e) => setField('affectsPayroll', e.target.checked)}
              />
              <label htmlFor="affectsPayroll">Afecta a nómina</label>
            </div>
          </div>

          <div className="danger-zone">
            <div className="form-actions">
              {mode === 'edit' && values.id && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="button button-danger"
                >
                  Eliminar
                </button>
              )}

              <button
                type="button"
                onClick={() => router.push('/maestros/ausencias')}
                className="button button-secondary"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="button button-primary"
              >
                {submitting
                  ? 'Guardando...'
                  : mode === 'create'
                  ? 'Crear tipo de ausencia'
                  : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </form>
  )
}