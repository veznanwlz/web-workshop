CREATE TABLE IF NOT EXISTS public.meeting (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    start_time timestamp NOT NULL,
    end_time timestamp,
    created_at timestamp DEFAULT current_timestamp NOT NULL,
    updated_at timestamp DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (uuid)
);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = current_timestamp;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meeting_updated_at 
    BEFORE UPDATE ON public.meeting 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
