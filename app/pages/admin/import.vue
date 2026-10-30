<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Excel Import — Employee Admin' })

type ImportJob = Database['public']['Tables']['employee_import_jobs']['Row']

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const { isAdmin } = useUserRole()
const toast = useToast()

const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const processing = ref(false)
const loadingJobs = ref(false)
const jobs = ref<ImportJob[]>([])
const loadError = ref('')
const maxFileSize = 5 * 1024 * 1024
const excelMimeType =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

watch(
  isAdmin,
  (value) => {
    if (value) loadJobs()
  },
  { immediate: true }
)

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  selectedFile.value = file

  if (!file) return
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    selectedFile.value = null
    input.value = ''
    toast.add({ title: 'Choose an .xlsx workbook.', color: 'error' })
  } else if (file.size > maxFileSize) {
    selectedFile.value = null
    input.value = ''
    toast.add({ title: 'File must not exceed 5 MB.', color: 'error' })
  }
}

async function loadJobs() {
  loadingJobs.value = true
  loadError.value = ''
  const { data, error } = await supabase
    .from('employee_import_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) {
    loadError.value = error.message
    toast.add({ title: 'Could not load import history', description: error.message, color: 'error' })
  } else {
    jobs.value = data
  }
  loadingJobs.value = false
}

async function uploadFile() {
  if (!selectedFile.value) {
    toast.add({ title: 'Choose an Excel workbook first.', color: 'warning' })
    return
  }

  const userId = user.value?.sub
  if (!userId) {
    toast.add({ title: 'Your login session is unavailable. Sign in again.', color: 'error' })
    return
  }

  uploading.value = true
  const objectPath = `${userId}/${crypto.randomUUID()}.xlsx`
  const { error: uploadError } = await supabase.storage
    .from('employee-imports')
    .upload(objectPath, selectedFile.value, {
      contentType: excelMimeType,
      upsert: false
    })

  if (uploadError) {
    uploading.value = false
    toast.add({ title: 'File upload failed', description: uploadError.message, color: 'error' })
    return
  }

  const { error: insertError } = await supabase
    .from('employee_import_jobs')
    .insert({
      created_by: userId,
      object_path: objectPath,
      status: 'pending'
    })

  if (insertError) {
    const { error: cleanupError } = await supabase.storage
      .from('employee-imports')
      .remove([objectPath])
    uploading.value = false
    toast.add({
      title: 'Could not queue the import',
      description: cleanupError
        ? `${insertError.message}; uploaded-file cleanup also failed: ${cleanupError.message}`
        : insertError.message,
      color: 'error'
    })
    return
  }

  selectedFile.value = null
  const fileInput = document.querySelector<HTMLInputElement>('#employee-import-file')
  if (fileInput) fileInput.value = ''
  uploading.value = false

  toast.add({
    title: 'File uploaded successfully',
    description: 'The import job is queued and will be processed by the cron job automatically.',
    color: 'success'
  })
  await loadJobs()
}

async function processNextJob() {
  processing.value = true
  const { data, error } = await supabase.functions.invoke('import-employees')
  processing.value = false

  if (error) {
    toast.add({ title: 'Could not process import', description: error.message, color: 'error' })
  } else if (data?.status === 'completed') {
    toast.add({
      title: 'Import completed',
      description: `${data.importedRows} employee rows imported or updated.`,
      color: 'success'
    })
  } else if (data?.status === 'failed') {
    toast.add({ title: 'Import failed', description: data.error, color: 'error' })
  } else {
    toast.add({ title: 'No pending import jobs', color: 'info' })
  }
  await loadJobs()
}

function statusColor(status: ImportJob['status']) {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'error'
  if (status === 'processing') return 'warning'
  return 'neutral'
}
</script>

<template>
  <div class="flex max-w-5xl flex-col gap-5">
    <div>
      <h2 class="text-2xl font-bold">Excel import</h2>
      <p class="mt-1 text-sm text-gray-500">
        Upload a private .xlsx workbook to queue it for import. Jobs are processed automatically by cron every 5 minutes.
      </p>
    </div>

    <UAlert
      v-if="!isAdmin"
      color="warning"
      variant="subtle"
      icon="i-lucide-lock"
      title="Administrator access required"
      description="Only an active admin account can upload and process employee imports."
    />

    <template v-else>
      <UCard>
        <div class="flex flex-col gap-4">
          <div>
            <h3 class="font-semibold">Workbook format</h3>
            <p class="mt-1 text-sm text-gray-500">
              Use the first worksheet with headers:
              <code>full_name, email, phone, address, role, is_active, photo_url</code>.
              Only full_name and email are required. Do not include id or created_at.
            </p>
            <p class="mt-1 text-sm text-gray-500">
              Existing employees are updated by email. Maximum file size is 5 MB and
              maximum workbook size is 1,000 data rows. Duplicate emails in one file
              are rejected.
            </p>
          </div>

          <UFormField label="Excel workbook (.xlsx)" name="employee-import-file">
            <input
              id="employee-import-file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              class="block w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-700"
              :disabled="uploading"
              @change="handleFileChange"
            >
          </UFormField>

          <div class="flex flex-wrap gap-3">
            <UButton
              icon="i-lucide-upload"
              :loading="uploading"
              :disabled="uploading || processing"
              @click="uploadFile"
            >
              Upload file
            </UButton>
            <UButton
              variant="outline"
              icon="i-lucide-play"
              :loading="processing"
              :disabled="uploading || processing"
              @click="processNextJob"
            >
              Process next pending job
            </UButton>
          </div>

          <UAlert
            color="info"
            variant="subtle"
            icon="i-lucide-info"
            title="Import processing"
            description="Uploaded files are queued with 'pending' status. They will be processed automatically by the cron job every 5 minutes, or you can click 'Process next pending job' to process manually."
          />
        </div>
      </UCard>

      <UCard>
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-semibold">Recent import jobs</h3>
          <UButton
            variant="ghost"
            icon="i-lucide-refresh-cw"
            :loading="loadingJobs"
            @click="loadJobs"
          >
            Refresh
          </UButton>
        </div>

        <UAlert
          v-if="loadError"
          color="error"
          variant="subtle"
          title="Could not load import history"
          :description="loadError"
        />

        <div v-else-if="jobs.length" class="overflow-x-auto">
          <table class="w-full min-w-[650px] text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="p-2">Created</th>
                <th class="p-2">File path</th>
                <th class="p-2">Status</th>
                <th class="p-2">Imported / total</th>
                <th class="p-2">Message</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="job in jobs"
                :key="job.id"
                class="border-b border-gray-100 dark:border-gray-900"
              >
                <td class="p-2">{{ new Date(job.created_at).toLocaleString() }}</td>
                <td class="max-w-40 truncate p-2">{{ job.object_path }}</td>
                <td class="p-2">
                  <UBadge :color="statusColor(job.status)" variant="subtle">
                    {{ job.status }}
                  </UBadge>
                </td>
                <td class="p-2">
                  {{ job.imported_rows ?? '—' }} / {{ job.total_rows ?? '—' }}
                </td>
                <td class="max-w-64 p-2 text-red-600">{{ job.error_message ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-gray-500">
          No import jobs yet.
        </p>
      </UCard>
    </template>
  </div>
</template>
