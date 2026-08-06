{{- define "hello-env.labels" -}}
app.kubernetes.io/name: hello-env
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
environment: {{ .Values.environment }}
{{- end -}}
