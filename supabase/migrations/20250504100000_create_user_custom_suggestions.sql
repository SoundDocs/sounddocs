CREATE TABLE public.user_custom_suggestions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    field_type text NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_custom_suggestions_pkey PRIMARY KEY (id),
    CONSTRAINT user_custom_suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_custom_suggestions_user_field_value_unique UNIQUE (user_id, field_type, value)
);

ALTER TABLE public.user_custom_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage their own suggestions"
ON public.user_custom_suggestions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_custom_suggestions IS 'Stores custom text input suggestions for users.';
COMMENT ON COLUMN public.user_custom_suggestions.field_type IS 'Identifier for the field this suggestion belongs to (e.g., input_device, output_destination_type).';
COMMENT ON COLUMN public.user_custom_suggestions.value IS 'The custom text value entered by the user.';
