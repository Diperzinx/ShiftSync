-- Create function to delete user (admin only)
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to delete users
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
  
  -- Delete the user (cascade will handle related records)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;