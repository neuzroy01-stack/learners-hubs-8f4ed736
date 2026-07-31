ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS instructor_name text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'Hindi',
  ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'Beginner';

DROP TRIGGER IF EXISTS touch_courses_updated_at ON public.courses;
CREATE TRIGGER touch_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();