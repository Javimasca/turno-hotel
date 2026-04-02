import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AbsenceTypeForm } from '@/components/absence-types/absence-type-form'
import { absenceTypeService } from '@/lib/absence-types/absence-type.service'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function EditAbsenceTypePage({ params }: Props) {
  const { id } = await params

  const result = await absenceTypeService.getById(id)

  if (!result.ok) {
    if (result.status === 404) {
      notFound()
    }

    throw new Error(result.error)
  }

  const item = result.data

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Maestros
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            Editar tipo de ausencia
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Ajusta la configuración de{' '}
            <span className="font-medium text-gray-900">{item.name}</span> para
            controlar su uso en planificación, validaciones y procesos internos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/maestros/ausencias"
            className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Volver al listado
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-1 shadow-sm">
        <div className="rounded-[22px] bg-white p-6 md:p-8">
          <AbsenceTypeForm
            mode="edit"
            initialValues={{
              id: item.id,
              code: item.code,
              name: item.name,
              description: item.description ?? '',
              displayOrder: item.displayOrder,
              isActive: item.isActive,
              durationMode: item.durationMode,
              requiresApproval: item.requiresApproval,
              isPaid: item.isPaid,
              blocksShifts: item.blocksShifts,
              countsAsWorkedTime: item.countsAsWorkedTime,
              requiresDocument: item.requiresDocument,
              allowsNotes: item.allowsNotes,
              affectsPayroll: item.affectsPayroll,
              color: item.color ?? '',
              icon: item.icon ?? '',
              legalCategory: item.legalCategory ?? '',
            }}
          />
        </div>
      </section>
    </main>
  )
}