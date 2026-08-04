{{- define "n-tier-app.labels" -}}
app.kubernetes.io/part-of: {{ .Chart.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "n-tier-app.componentLabels" -}}
{{ include "n-tier-app.labels" . }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}
