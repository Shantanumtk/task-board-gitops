{{- define "task-board-kafka.labels" -}}
app.kubernetes.io/part-of: {{ .Chart.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "task-board-kafka.componentLabels" -}}
{{ include "task-board-kafka.labels" . }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}
