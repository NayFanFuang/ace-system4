--
-- PostgreSQL database dump
--

\restrict NlazfTt5LLev5U8OVXSbtK61JvsFKl6Je1cgeesRG6ewXLTa6yhHtUZSp2hfaHR

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.clock_sessions DROP CONSTRAINT IF EXISTS clock_sessions_site_id_fkey;
DROP INDEX IF EXISTS public.ix_project_sites_site_code;
DROP INDEX IF EXISTS public.ix_project_sites_project_code;
DROP INDEX IF EXISTS public.ix_project_sites_is_active;
DROP INDEX IF EXISTS public.ix_project_sites_customer;
DROP INDEX IF EXISTS public.ix_project_pos_workflow_status;
DROP INDEX IF EXISTS public.ix_project_pos_work_type;
DROP INDEX IF EXISTS public.ix_project_pos_site_code;
DROP INDEX IF EXISTS public.ix_project_pos_project_code;
DROP INDEX IF EXISTS public.ix_project_pos_po_target;
DROP INDEX IF EXISTS public.ix_project_pos_po_number;
DROP INDEX IF EXISTS public.ix_project_pos_need_mapping_review;
DROP INDEX IF EXISTS public.ix_project_pos_locked;
DROP INDEX IF EXISTS public.ix_project_pos_current_owner_role;
DROP INDEX IF EXISTS public.ix_project_catalog_team;
DROP INDEX IF EXISTS public.ix_project_catalog_project_code;
DROP INDEX IF EXISTS public.ix_project_assignments_live_role_in_project;
DROP INDEX IF EXISTS public.ix_project_assignments_live_project_code;
DROP INDEX IF EXISTS public.ix_project_assignments_live_is_active;
DROP INDEX IF EXISTS public.ix_project_assignments_live_employee_code;
DROP INDEX IF EXISTS public.ix_leave_requests_status;
DROP INDEX IF EXISTS public.ix_leave_requests_start_date;
DROP INDEX IF EXISTS public.ix_leave_requests_employee_code;
DROP INDEX IF EXISTS public.ix_kpi_period_items_period;
DROP INDEX IF EXISTS public.ix_kpi_period_items_item_id;
DROP INDEX IF EXISTS public.ix_kpi_period_items_employee_name;
DROP INDEX IF EXISTS public.ix_kpi_items_position;
DROP INDEX IF EXISTS public.ix_kpi_items_item_id;
DROP INDEX IF EXISTS public.ix_kpi_evaluations_period;
DROP INDEX IF EXISTS public.ix_kpi_evaluations_item_id;
DROP INDEX IF EXISTS public.ix_kpi_evaluations_eval_id;
DROP INDEX IF EXISTS public.ix_kpi_evaluations_employee_name;
DROP INDEX IF EXISTS public.ix_kpi_evaluations_employee_code;
DROP INDEX IF EXISTS public.ix_employees_status;
DROP INDEX IF EXISTS public.ix_employees_project_team;
DROP INDEX IF EXISTS public.ix_employees_project_code;
DROP INDEX IF EXISTS public.ix_employees_manager_code;
DROP INDEX IF EXISTS public.ix_employees_last_name;
DROP INDEX IF EXISTS public.ix_employees_full_name;
DROP INDEX IF EXISTS public.ix_employees_first_name;
DROP INDEX IF EXISTS public.ix_employees_employee_code;
DROP INDEX IF EXISTS public.ix_employees_email;
DROP INDEX IF EXISTS public.ix_employees_department;
DROP INDEX IF EXISTS public.ix_employee_relocations_to_project_code;
DROP INDEX IF EXISTS public.ix_employee_relocations_from_project_code;
DROP INDEX IF EXISTS public.ix_employee_relocations_employee_code;
DROP INDEX IF EXISTS public.ix_employee_relocations_effective_date;
DROP INDEX IF EXISTS public.ix_email_outbox_status;
DROP INDEX IF EXISTS public.ix_email_outbox_recipient;
DROP INDEX IF EXISTS public.ix_clock_sites_site_code;
DROP INDEX IF EXISTS public.ix_clock_sites_project_code;
DROP INDEX IF EXISTS public.ix_clock_sessions_work_date;
DROP INDEX IF EXISTS public.ix_clock_sessions_user_id;
DROP INDEX IF EXISTS public.ix_clock_sessions_employee_code;
DROP INDEX IF EXISTS public.ix_auth_users_role;
DROP INDEX IF EXISTS public.ix_auth_users_employee_code;
DROP INDEX IF EXISTS public.ix_auth_login_logs_success;
DROP INDEX IF EXISTS public.ix_auth_login_logs_ip_address;
DROP INDEX IF EXISTS public.ix_auth_login_logs_identifier;
DROP INDEX IF EXISTS public.ix_auth_login_logs_employee_code;
DROP INDEX IF EXISTS public.ix_auth_login_logs_created_at;
DROP INDEX IF EXISTS public.ix_auth_audit_logs_employee_code;
DROP INDEX IF EXISTS public.ix_auth_audit_logs_action;
DROP INDEX IF EXISTS public.ix_audit_logs_ip_address;
DROP INDEX IF EXISTS public.ix_audit_logs_entity_type;
DROP INDEX IF EXISTS public.ix_audit_logs_entity_id;
DROP INDEX IF EXISTS public.ix_audit_logs_employee_id;
DROP INDEX IF EXISTS public.ix_audit_logs_created_at;
DROP INDEX IF EXISTS public.ix_audit_logs_changed_by_user_id;
DROP INDEX IF EXISTS public.ix_audit_logs_action;
ALTER TABLE IF EXISTS ONLY public.project_sites DROP CONSTRAINT IF EXISTS uq_project_site_code;
ALTER TABLE IF EXISTS ONLY public.project_catalog DROP CONSTRAINT IF EXISTS uq_project_catalog_code;
ALTER TABLE IF EXISTS ONLY public.project_assignments_live DROP CONSTRAINT IF EXISTS uq_live_project_assignment;
ALTER TABLE IF EXISTS ONLY public.kpi_period_items DROP CONSTRAINT IF EXISTS uq_kpi_period_emp_item;
ALTER TABLE IF EXISTS ONLY public.kpi_items DROP CONSTRAINT IF EXISTS uq_kpi_item_id;
ALTER TABLE IF EXISTS ONLY public.kpi_evaluations DROP CONSTRAINT IF EXISTS uq_kpi_eval_emp_period_item;
ALTER TABLE IF EXISTS ONLY public.system_settings DROP CONSTRAINT IF EXISTS system_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.project_sites DROP CONSTRAINT IF EXISTS project_sites_pkey;
ALTER TABLE IF EXISTS ONLY public.project_pos DROP CONSTRAINT IF EXISTS project_pos_pkey;
ALTER TABLE IF EXISTS ONLY public.project_catalog DROP CONSTRAINT IF EXISTS project_catalog_pkey;
ALTER TABLE IF EXISTS ONLY public.project_assignments_live DROP CONSTRAINT IF EXISTS project_assignments_live_pkey;
ALTER TABLE IF EXISTS ONLY public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_period_items DROP CONSTRAINT IF EXISTS kpi_period_items_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_items DROP CONSTRAINT IF EXISTS kpi_items_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_evaluations DROP CONSTRAINT IF EXISTS kpi_evaluations_pkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_relocations DROP CONSTRAINT IF EXISTS employee_relocations_pkey;
ALTER TABLE IF EXISTS ONLY public.email_outbox DROP CONSTRAINT IF EXISTS email_outbox_pkey;
ALTER TABLE IF EXISTS ONLY public.clock_sites DROP CONSTRAINT IF EXISTS clock_sites_pkey;
ALTER TABLE IF EXISTS ONLY public.clock_sessions DROP CONSTRAINT IF EXISTS clock_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_users DROP CONSTRAINT IF EXISTS auth_users_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_login_logs DROP CONSTRAINT IF EXISTS auth_login_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_audit_logs DROP CONSTRAINT IF EXISTS auth_audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS public.project_sites ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.project_pos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.project_catalog ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.project_assignments_live ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.leave_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_period_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_evaluations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.employees ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.employee_relocations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.email_outbox ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.clock_sites ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.clock_sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.auth_users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.auth_login_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.auth_audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.system_settings;
DROP SEQUENCE IF EXISTS public.project_sites_id_seq;
DROP TABLE IF EXISTS public.project_sites;
DROP SEQUENCE IF EXISTS public.project_pos_id_seq;
DROP TABLE IF EXISTS public.project_pos;
DROP SEQUENCE IF EXISTS public.project_catalog_id_seq;
DROP TABLE IF EXISTS public.project_catalog;
DROP SEQUENCE IF EXISTS public.project_assignments_live_id_seq;
DROP TABLE IF EXISTS public.project_assignments_live;
DROP SEQUENCE IF EXISTS public.leave_requests_id_seq;
DROP TABLE IF EXISTS public.leave_requests;
DROP SEQUENCE IF EXISTS public.kpi_period_items_id_seq;
DROP TABLE IF EXISTS public.kpi_period_items;
DROP SEQUENCE IF EXISTS public.kpi_items_id_seq;
DROP TABLE IF EXISTS public.kpi_items;
DROP SEQUENCE IF EXISTS public.kpi_evaluations_id_seq;
DROP TABLE IF EXISTS public.kpi_evaluations;
DROP SEQUENCE IF EXISTS public.employees_id_seq;
DROP TABLE IF EXISTS public.employees;
DROP SEQUENCE IF EXISTS public.employee_relocations_id_seq;
DROP TABLE IF EXISTS public.employee_relocations;
DROP SEQUENCE IF EXISTS public.email_outbox_id_seq;
DROP TABLE IF EXISTS public.email_outbox;
DROP SEQUENCE IF EXISTS public.clock_sites_id_seq;
DROP TABLE IF EXISTS public.clock_sites;
DROP SEQUENCE IF EXISTS public.clock_sessions_id_seq;
DROP TABLE IF EXISTS public.clock_sessions;
DROP SEQUENCE IF EXISTS public.auth_users_id_seq;
DROP TABLE IF EXISTS public.auth_users;
DROP SEQUENCE IF EXISTS public.auth_login_logs_id_seq;
DROP TABLE IF EXISTS public.auth_login_logs;
DROP SEQUENCE IF EXISTS public.auth_audit_logs_id_seq;
DROP TABLE IF EXISTS public.auth_audit_logs;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    entity_type character varying(80) NOT NULL,
    entity_id character varying(80),
    employee_id integer,
    action character varying(100) NOT NULL,
    action_label character varying(180) NOT NULL,
    changed_by_user_id integer,
    changed_by_name character varying(180),
    changed_by_email character varying(180),
    old_value json,
    new_value json,
    changed_fields json,
    ip_address character varying(80),
    user_agent text,
    source character varying(80) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO ace_user;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO ace_user;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: auth_audit_logs; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.auth_audit_logs (
    id integer NOT NULL,
    employee_code character varying(30),
    action character varying(80) NOT NULL,
    success boolean NOT NULL,
    detail text,
    actor_employee_code character varying(30),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.auth_audit_logs OWNER TO ace_user;

--
-- Name: auth_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.auth_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_audit_logs_id_seq OWNER TO ace_user;

--
-- Name: auth_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.auth_audit_logs_id_seq OWNED BY public.auth_audit_logs.id;


--
-- Name: auth_login_logs; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.auth_login_logs (
    id integer NOT NULL,
    identifier character varying(150) NOT NULL,
    employee_code character varying(30),
    ip_address character varying(80),
    user_agent text,
    success boolean NOT NULL,
    failure_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.auth_login_logs OWNER TO ace_user;

--
-- Name: auth_login_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.auth_login_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_login_logs_id_seq OWNER TO ace_user;

--
-- Name: auth_login_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.auth_login_logs_id_seq OWNED BY public.auth_login_logs.id;


--
-- Name: auth_users; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.auth_users (
    id integer NOT NULL,
    employee_code character varying(30) NOT NULL,
    password_hash character varying(200) NOT NULL,
    first_name character varying(80) NOT NULL,
    last_name character varying(80) NOT NULL,
    email character varying(150),
    department character varying(50) NOT NULL,
    team character varying(50),
    position_code character varying(30) NOT NULL,
    position_name character varying(100) NOT NULL,
    clock_type character varying(20) NOT NULL,
    gps_required boolean NOT NULL,
    photo_required boolean NOT NULL,
    work_lat double precision,
    work_lng double precision,
    work_location_name character varying(100),
    allowed_radius_m integer NOT NULL,
    role character varying(40) NOT NULL,
    must_change_password boolean NOT NULL,
    failed_login_count integer NOT NULL,
    locked_until timestamp with time zone,
    last_login_at timestamp with time zone,
    password_changed_at timestamp with time zone,
    created_by integer,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    token_version integer DEFAULT 1
);


ALTER TABLE public.auth_users OWNER TO ace_user;

--
-- Name: auth_users_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.auth_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_users_id_seq OWNER TO ace_user;

--
-- Name: auth_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.auth_users_id_seq OWNED BY public.auth_users.id;


--
-- Name: clock_sessions; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.clock_sessions (
    id integer NOT NULL,
    employee_code character varying(30) NOT NULL,
    user_id integer,
    clock_type character varying(20) NOT NULL,
    work_date date NOT NULL,
    site_id integer,
    site_code character varying(50),
    site_name character varying(200),
    clock_in_at timestamp with time zone,
    lat_in double precision,
    lng_in double precision,
    photo_in text,
    clock_out_at timestamp with time zone,
    lat_out double precision,
    lng_out double precision,
    photo_out text,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clock_sessions OWNER TO ace_user;

--
-- Name: clock_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.clock_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clock_sessions_id_seq OWNER TO ace_user;

--
-- Name: clock_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.clock_sessions_id_seq OWNED BY public.clock_sessions.id;


--
-- Name: clock_sites; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.clock_sites (
    id integer NOT NULL,
    site_code character varying(50) NOT NULL,
    site_name character varying(200),
    customer character varying(50),
    project_code character varying(50),
    lat double precision,
    lng double precision,
    gps_radius_m integer NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clock_sites OWNER TO ace_user;

--
-- Name: clock_sites_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.clock_sites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clock_sites_id_seq OWNER TO ace_user;

--
-- Name: clock_sites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.clock_sites_id_seq OWNED BY public.clock_sites.id;


--
-- Name: email_outbox; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.email_outbox (
    id integer NOT NULL,
    recipient character varying(150) NOT NULL,
    subject character varying(250) NOT NULL,
    body_text text NOT NULL,
    body_html text,
    status character varying(30) NOT NULL,
    provider character varying(80),
    error_code character varying(80),
    error_message text,
    attempts integer NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_outbox OWNER TO ace_user;

--
-- Name: email_outbox_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.email_outbox_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_outbox_id_seq OWNER TO ace_user;

--
-- Name: email_outbox_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.email_outbox_id_seq OWNED BY public.email_outbox.id;


--
-- Name: employee_relocations; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.employee_relocations (
    id integer NOT NULL,
    employee_code character varying(30) NOT NULL,
    full_name character varying(150),
    from_project_code character varying(50),
    from_project_name character varying(250),
    to_project_code character varying(50),
    to_project_name character varying(250),
    effective_date date NOT NULL,
    reason character varying(200),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.employee_relocations OWNER TO ace_user;

--
-- Name: employee_relocations_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.employee_relocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_relocations_id_seq OWNER TO ace_user;

--
-- Name: employee_relocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.employee_relocations_id_seq OWNED BY public.employee_relocations.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    employee_code character varying(30) NOT NULL,
    email character varying(150),
    full_name character varying(150) NOT NULL,
    first_name character varying(80),
    last_name character varying(80),
    preferred_name character varying(80),
    personal_email character varying(150),
    phone character varying(40),
    work_phone character varying(40),
    department character varying(50) NOT NULL,
    job_title character varying(120),
    job_level character varying(50),
    manager_name character varying(150),
    manager_code character varying(30),
    cost_center character varying(80),
    work_location character varying(150),
    project_team character varying(30) NOT NULL,
    section_name character varying(80),
    project_role character varying(100),
    project_code character varying(50),
    project_name character varying(250),
    "position" character varying(100),
    status character varying(20) NOT NULL,
    employment_type character varying(40),
    contract_type character varying(40),
    hire_date date,
    probation_end_date date,
    termination_date date,
    date_of_birth date,
    gender character varying(20),
    nationality character varying(80),
    id_card_no character varying(40),
    address text,
    emergency_contact_name character varying(150),
    emergency_contact_relation character varying(80),
    emergency_contact_phone character varying(40),
    bank_name character varying(100),
    bank_account_no character varying(60),
    bank_account_name character varying(150),
    photo_url character varying(300),
    notes text,
    source character varying(30) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.employees OWNER TO ace_user;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO ace_user;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: kpi_evaluations; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.kpi_evaluations (
    id integer NOT NULL,
    eval_id character varying(30),
    employee_name character varying(150) NOT NULL,
    employee_code character varying(30),
    "position" character varying(100),
    period character varying(7) NOT NULL,
    item_id character varying(20) NOT NULL,
    main_evaluate character varying(150),
    evaluate_item character varying(200),
    weight integer NOT NULL,
    target integer NOT NULL,
    actual double precision,
    score double precision,
    remark text,
    evaluated_by character varying(30),
    source_updated_at character varying(30),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.kpi_evaluations OWNER TO ace_user;

--
-- Name: kpi_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.kpi_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kpi_evaluations_id_seq OWNER TO ace_user;

--
-- Name: kpi_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.kpi_evaluations_id_seq OWNED BY public.kpi_evaluations.id;


--
-- Name: kpi_items; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.kpi_items (
    id integer NOT NULL,
    item_id character varying(20) NOT NULL,
    "position" character varying(100),
    main_evaluate character varying(150),
    evaluate_item character varying(200),
    weight integer NOT NULL,
    target integer NOT NULL,
    active boolean NOT NULL,
    source_updated_at character varying(30),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.kpi_items OWNER TO ace_user;

--
-- Name: kpi_items_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.kpi_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kpi_items_id_seq OWNER TO ace_user;

--
-- Name: kpi_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.kpi_items_id_seq OWNED BY public.kpi_items.id;


--
-- Name: kpi_period_items; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.kpi_period_items (
    id integer NOT NULL,
    period character varying(7) NOT NULL,
    employee_name character varying(150) NOT NULL,
    "position" character varying(100),
    item_id character varying(20) NOT NULL,
    weight integer NOT NULL,
    active boolean NOT NULL,
    source_updated_at character varying(30),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.kpi_period_items OWNER TO ace_user;

--
-- Name: kpi_period_items_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.kpi_period_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kpi_period_items_id_seq OWNER TO ace_user;

--
-- Name: kpi_period_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.kpi_period_items_id_seq OWNED BY public.kpi_period_items.id;


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.leave_requests (
    id integer NOT NULL,
    employee_code character varying(30) NOT NULL,
    employee_name character varying(150) NOT NULL,
    leave_type character varying(50) NOT NULL,
    session_type character varying(30) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    days double precision NOT NULL,
    reason text,
    attachment_url character varying(500),
    status character varying(20) NOT NULL,
    pm_approved_by character varying(30),
    pm_approved_at timestamp with time zone,
    spm_approved_by character varying(30),
    spm_approved_at timestamp with time zone,
    dc_approved_by character varying(30),
    dc_approved_at timestamp with time zone,
    hr_acknowledged_by character varying(30),
    hr_acknowledged_at timestamp with time zone,
    reject_at_step character varying(10),
    reject_reason text,
    reviewed_by character varying(30),
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.leave_requests OWNER TO ace_user;

--
-- Name: leave_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.leave_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_requests_id_seq OWNER TO ace_user;

--
-- Name: leave_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.leave_requests_id_seq OWNED BY public.leave_requests.id;


--
-- Name: project_assignments_live; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.project_assignments_live (
    id integer NOT NULL,
    project_code character varying(50) NOT NULL,
    employee_code character varying(30) NOT NULL,
    role_in_project character varying(50) NOT NULL,
    job_level character varying(20),
    start_date date,
    end_date date,
    allocation_pct integer NOT NULL,
    is_active boolean NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    clock_type character varying(20) DEFAULT 'DAILY'::character varying NOT NULL
);


ALTER TABLE public.project_assignments_live OWNER TO ace_user;

--
-- Name: project_assignments_live_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.project_assignments_live_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_assignments_live_id_seq OWNER TO ace_user;

--
-- Name: project_assignments_live_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.project_assignments_live_id_seq OWNED BY public.project_assignments_live.id;


--
-- Name: project_catalog; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.project_catalog (
    id integer NOT NULL,
    project_code character varying(50) NOT NULL,
    project_name character varying(250) NOT NULL,
    team character varying(30) NOT NULL,
    headcount integer NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_catalog OWNER TO ace_user;

--
-- Name: project_catalog_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.project_catalog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_catalog_id_seq OWNER TO ace_user;

--
-- Name: project_catalog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.project_catalog_id_seq OWNED BY public.project_catalog.id;


--
-- Name: project_pos; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.project_pos (
    id integer NOT NULL,
    po_target character varying(20) NOT NULL,
    project_code character varying(50),
    po_number character varying(80) NOT NULL,
    po_line character varying(30),
    du_id character varying(80),
    item_dis character varying(200),
    cluster_site character varying(200),
    owner character varying(150),
    lat_long character varying(80),
    on_air date,
    cluster_type character varying(150),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    work_type character varying(20),
    site_code character varying(50),
    workflow_status character varying(40) DEFAULT 'NEW'::character varying NOT NULL,
    mapping_confidence integer DEFAULT 0 NOT NULL,
    mapping_rule character varying(120),
    need_mapping_review boolean DEFAULT true NOT NULL,
    current_owner_role character varying(40) DEFAULT 'FINANCE'::character varying NOT NULL,
    current_owner_user character varying(120),
    hold_reason text,
    expected_release_date date,
    finance_checked_at timestamp with time zone,
    sent_to_project_at timestamp with time zone,
    project_accepted_at timestamp with time zone,
    approved_at timestamp with time zone,
    revision integer DEFAULT 1 NOT NULL,
    locked boolean DEFAULT false NOT NULL,
    last_action_at timestamp with time zone,
    source character varying(30)
);


ALTER TABLE public.project_pos OWNER TO ace_user;

--
-- Name: project_pos_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.project_pos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_pos_id_seq OWNER TO ace_user;

--
-- Name: project_pos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.project_pos_id_seq OWNED BY public.project_pos.id;


--
-- Name: project_sites; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.project_sites (
    id integer NOT NULL,
    project_code character varying(50),
    site_code character varying(50) NOT NULL,
    site_name character varying(200),
    customer character varying(50),
    lat double precision,
    lng double precision,
    gps_radius_m integer NOT NULL,
    province character varying(100),
    district character varying(100),
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_sites OWNER TO ace_user;

--
-- Name: project_sites_id_seq; Type: SEQUENCE; Schema: public; Owner: ace_user
--

CREATE SEQUENCE public.project_sites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_sites_id_seq OWNER TO ace_user;

--
-- Name: project_sites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ace_user
--

ALTER SEQUENCE public.project_sites_id_seq OWNED BY public.project_sites.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: ace_user
--

CREATE TABLE public.system_settings (
    key character varying(80) NOT NULL,
    value text NOT NULL,
    label character varying(150),
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_settings OWNER TO ace_user;

--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: auth_audit_logs id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.auth_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.auth_audit_logs_id_seq'::regclass);


--
-- Name: auth_login_logs id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.auth_login_logs ALTER COLUMN id SET DEFAULT nextval('public.auth_login_logs_id_seq'::regclass);


--
-- Name: auth_users id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.auth_users ALTER COLUMN id SET DEFAULT nextval('public.auth_users_id_seq'::regclass);


--
-- Name: clock_sessions id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.clock_sessions ALTER COLUMN id SET DEFAULT nextval('public.clock_sessions_id_seq'::regclass);


--
-- Name: clock_sites id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.clock_sites ALTER COLUMN id SET DEFAULT nextval('public.clock_sites_id_seq'::regclass);


--
-- Name: email_outbox id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.email_outbox ALTER COLUMN id SET DEFAULT nextval('public.email_outbox_id_seq'::regclass);


--
-- Name: employee_relocations id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.employee_relocations ALTER COLUMN id SET DEFAULT nextval('public.employee_relocations_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: kpi_evaluations id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.kpi_evaluations ALTER COLUMN id SET DEFAULT nextval('public.kpi_evaluations_id_seq'::regclass);


--
-- Name: kpi_items id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.kpi_items ALTER COLUMN id SET DEFAULT nextval('public.kpi_items_id_seq'::regclass);


--
-- Name: kpi_period_items id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.kpi_period_items ALTER COLUMN id SET DEFAULT nextval('public.kpi_period_items_id_seq'::regclass);


--
-- Name: leave_requests id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.leave_requests ALTER COLUMN id SET DEFAULT nextval('public.leave_requests_id_seq'::regclass);


--
-- Name: project_assignments_live id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.project_assignments_live ALTER COLUMN id SET DEFAULT nextval('public.project_assignments_live_id_seq'::regclass);


--
-- Name: project_catalog id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.project_catalog ALTER COLUMN id SET DEFAULT nextval('public.project_catalog_id_seq'::regclass);


--
-- Name: project_pos id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.project_pos ALTER COLUMN id SET DEFAULT nextval('public.project_pos_id_seq'::regclass);


--
-- Name: project_sites id; Type: DEFAULT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.project_sites ALTER COLUMN id SET DEFAULT nextval('public.project_sites_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.audit_logs (id, entity_type, entity_id, employee_id, action, action_label, changed_by_user_id, changed_by_name, changed_by_email, old_value, new_value, changed_fields, ip_address, user_agent, source, created_at) FROM stdin;
\.


--
-- Data for Name: auth_audit_logs; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.auth_audit_logs (id, employee_code, action, success, detail, actor_employee_code, created_at) FROM stdin;
1	hr	LOGIN	f	User not found	\N	2026-05-07 10:49:51.532672+00
2	HR-001	LOGIN	t	\N	\N	2026-05-07 10:50:45.392667+00
3	peerapol@airconnect-e.com	LOGIN	f	User not found	\N	2026-05-07 10:51:18.428135+00
4	ADMIN	LOGIN	t	\N	\N	2026-05-07 10:52:04.589047+00
5	HR-001	LOGIN	t	\N	\N	2026-05-07 10:53:40.993315+00
6	HR-001	LOGIN	t	\N	\N	2026-05-07 10:53:57.988648+00
7	ACE-042	LOGIN	t	\N	\N	2026-05-07 10:57:15.358105+00
8	ACE-042	LOGIN	t	\N	\N	2026-05-07 10:59:06.090815+00
9		LOGIN	f	User not found	\N	2026-05-07 11:00:13.001086+00
10	AEC-042	LOGIN	f	User not found	\N	2026-05-07 11:00:37.563365+00
11	ACE-042	LOGIN	t	\N	\N	2026-05-07 11:01:23.813843+00
12	ACE056	LOGIN	t	\N	\N	2026-05-07 11:05:46.979019+00
13	ADMIN	LOGIN	t	\N	\N	2026-05-07 11:10:37.100592+00
14	ACE056	LOGIN	f	Invalid password	\N	2026-05-07 11:13:15.029314+00
15	ACE056	LOGIN	t	\N	\N	2026-05-07 11:13:51.761382+00
16	ACE056	LOGIN	t	\N	\N	2026-05-07 11:16:50.072167+00
17	ACE010	LOGIN	f	User not found	\N	2026-05-07 13:11:42.885273+00
18	ACE292	LOGIN	f	User not found	\N	2026-05-07 13:12:10.413402+00
19	ACE010	LOGIN	f	User not found	\N	2026-05-07 13:12:30.252382+00
20	ACE010	LOGIN	f	User not found	\N	2026-05-07 13:12:51.132335+00
21	ADMIN	LOGIN	f	Invalid password	\N	2026-05-07 13:14:22.774985+00
22	ACE056	LOGIN	t	\N	\N	2026-05-07 13:15:09.493606+00
23	ACE010	LOGIN	f	User not found	\N	2026-05-07 13:15:25.121793+00
24	ACE056	LOGIN	t	\N	\N	2026-05-07 13:15:36.585493+00
25	ADMIN	LOGIN	t	\N	\N	2026-05-07 13:17:06.715273+00
26	ACE012	LOGIN	f	User not found	\N	2026-05-07 13:18:16.780192+00
27	ACE010	LOGIN	f	User not found	\N	2026-05-07 13:18:28.442892+00
28	ACEXLSX012	LOGIN	f	User not found	\N	2026-05-07 13:18:48.682224+00
29	ACE-XLSX-003	LOGIN	t	\N	\N	2026-05-07 13:20:16.492638+00
30	ACE-XLSX-012	LOGIN	t	\N	\N	2026-05-07 13:21:03.597528+00
31	ACE-XLSX-012	CHANGE_PASSWORD	t	\N	ACE-XLSX-012	2026-05-07 13:21:46.19992+00
32	ADMIN	LOGIN	f	Invalid password	\N	2026-05-07 13:28:47.769106+00
33	ADMIN	LOGIN	t	\N	\N	2026-05-07 13:29:14.976747+00
34	ACE-XLSX-003	LOGIN	t	\N	\N	2026-05-07 13:30:37.110964+00
35	ACE056	LOGIN	t	\N	\N	2026-05-07 13:30:37.709495+00
36	HR-001	LOGIN	t	\N	\N	2026-05-07 13:30:38.310853+00
37	ACE-XLSX-003	LOGIN	t	\N	\N	2026-05-07 13:32:03.110137+00
38	ACE-XLSX-003	CHANGE_PASSWORD	t	\N	ACE-XLSX-003	2026-05-07 13:32:03.888226+00
39	atthapol.bom@gmail.com	LOGIN	f	Invalid password	\N	2026-05-07 13:36:49.529558+00
40	atthapol.bom@gmail.com	LOGIN	f	Invalid password	\N	2026-05-07 13:37:08.303523+00
41	atthapol.bom@gmail.com	LOGIN	f	Invalid password	\N	2026-05-07 13:37:37.192348+00
42	ACE-XLSX-012	LOGIN	t	\N	\N	2026-05-07 13:38:30.392058+00
43	ACE-XLSX-021	LOGIN	t	\N	\N	2026-05-07 13:38:31.793262+00
44	ACE-XLSX-031	LOGIN	t	\N	\N	2026-05-07 13:38:32.391023+00
45	ACE-XLSX-011	LOGIN	t	\N	\N	2026-05-07 13:38:32.991617+00
46	atthapol.bom@gmail.com	LOGIN	f	Invalid password	\N	2026-05-07 13:39:02.581447+00
47	ACE-XLSX-012	LOGIN	t	\N	\N	2026-05-07 13:42:51.562428+00
48	phumipat38@gmail.com	LOGIN	f	Invalid password	\N	2026-05-07 13:46:03.020831+00
49	atthapol.bom@gmail.com	LOGIN	f	Invalid password	\N	2026-05-07 13:46:35.306109+00
50	ACE-XLSX-012	LOGIN	t	\N	\N	2026-05-07 13:49:55.446733+00
51	ACE-XLSX-012	LOGIN	t	\N	\N	2026-05-07 13:56:08.5664+00
52	ACE-XLSX-003	LOGIN	t	\N	\N	2026-05-07 14:03:15.074648+00
53	ADMIN	LOGIN	t	\N	\N	2026-05-07 19:05:45.029411+00
54	ACE-XLSX-012	LOGIN	t	\N	\N	2026-05-07 19:05:45.343609+00
55	atthapol@airconnect-e.com	LOGIN	f	User not found	\N	2026-05-07 19:05:45.628911+00
56	ADMIN	LOGIN	t	\N	\N	2026-05-07 19:06:24.157664+00
57	ADMIN	LOGIN	t	\N	\N	2026-05-07 19:09:10.626816+00
58	ADMIN	LOGIN	t	\N	\N	2026-05-07 19:14:35.546578+00
59	ADMIN	LOGIN	t	\N	\N	2026-05-07 19:15:23.58875+00
60	ADMIN	LOGIN	t	\N	\N	2026-05-07 19:23:10.470457+00
61	ADMIN	LOGIN	t	\N	\N	2026-05-07 19:24:30.659899+00
62	ACE056	LOGIN	f	Invalid password	\N	2026-05-07 19:31:00.97904+00
63	ACE056	LOGIN	f	Invalid password	\N	2026-05-07 19:31:39.994168+00
64	ACE056	LOGIN	f	Invalid password	\N	2026-05-07 19:38:19.841586+00
65	ACE056	LOGIN	f	Invalid password	\N	2026-05-07 19:38:31.603095+00
66	ACE056	LOGIN	f	Invalid password	\N	2026-05-07 19:38:48.199771+00
67	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-07 19:39:22.003135+00
68	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-07 19:39:23.129361+00
69	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-07 19:39:26.069687+00
70	ace056	LOGIN	f	Rate limited	\N	2026-05-07 19:39:26.16705+00
71	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-07 19:40:00.878291+00
72	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-07 19:40:47.978824+00
73	ACE056	LOGIN	t	\N	\N	2026-05-07 19:42:21.685348+00
74	ACE056	LOGIN	t	\N	\N	2026-05-07 19:42:53.066376+00
75	ACE056	LOGIN	f	Invalid password	\N	2026-05-07 19:43:08.48666+00
76	ACE056	LOGIN	t	\N	\N	2026-05-07 19:43:44.952554+00
77	ADMIN	LOGIN	f	Invalid password	\N	2026-05-07 19:44:22.544963+00
78	ADMIN	LOGIN	t	\N	\N	2026-05-07 19:44:40.224078+00
79	ADMIN	LOGIN	t	\N	\N	2026-05-08 05:54:58.881308+00
80	ACE174	LOGIN	f	Invalid password	\N	2026-05-08 06:23:52.363978+00
81	ACE174	LOGIN	f	Invalid password	\N	2026-05-08 06:24:15.483956+00
82	ACE174	LOGIN	t	\N	\N	2026-05-08 06:24:32.92347+00
83	ACE174	CHANGE_PASSWORD	t	\N	ACE174	2026-05-08 06:26:25.803715+00
84	ACE174	LOGIN	t	\N	\N	2026-05-08 06:26:41.403259+00
85	ACECS431	LOGIN	t	\N	\N	2026-05-08 06:33:37.354445+00
86	ACECS431	CHANGE_PASSWORD	t	\N	ACECS431	2026-05-08 06:36:03.401454+00
87	ACECS431	LOGIN	t	\N	\N	2026-05-08 06:36:08.763821+00
88	ACECS431	LOGIN	t	\N	\N	2026-05-08 06:37:09.414516+00
89	ACE-XLSX-012	LOGIN	t	\N	\N	2026-05-08 06:37:46.073015+00
90	ACE-XLSX-012	LOGIN	t	\N	\N	2026-05-08 06:38:05.132154+00
91	AE008	LOGIN	f	Invalid password	\N	2026-05-08 06:40:21.494784+00
92	AE008	LOGIN	f	Invalid password	\N	2026-05-08 06:40:24.336311+00
93	AE008	LOGIN	f	Invalid password	\N	2026-05-08 06:40:26.474056+00
94	AE008	LOGIN	t	\N	\N	2026-05-08 06:40:58.579816+00
95	AE008	CHANGE_PASSWORD	t	\N	AE008	2026-05-08 06:41:44.346256+00
96	AE008	LOGIN	t	\N	\N	2026-05-08 06:42:16.960043+00
97	AE106	LOGIN	t	\N	\N	2026-05-08 06:49:09.118133+00
98	AE106	CHANGE_PASSWORD	t	\N	AE106	2026-05-08 06:50:36.91297+00
99	AE106	LOGIN	t	\N	\N	2026-05-08 06:51:08.521325+00
100	ACE603	LOGIN	t	\N	\N	2026-05-08 06:52:12.242478+00
101	AE106	LOGIN	t	\N	\N	2026-05-08 06:52:27.526826+00
102	ACE603	CHANGE_PASSWORD	t	\N	ACE603	2026-05-08 06:53:48.450104+00
103	ACE603	LOGIN	t	\N	\N	2026-05-08 06:54:15.60286+00
104	AECS224	LOGIN	t	\N	\N	2026-05-08 07:00:48.538597+00
105	AECS224	CHANGE_PASSWORD	t	\N	AECS224	2026-05-08 07:01:49.249256+00
106	AECS224	LOGIN	t	\N	\N	2026-05-08 07:02:38.261191+00
107	ACE-XLSX-021	LOGIN	f	Invalid password	\N	2026-05-08 07:04:23.472348+00
108	ACE-XLSX-021	LOGIN	f	Invalid password	\N	2026-05-08 07:04:31.059059+00
109	AECS224	LOGIN	t	\N	\N	2026-05-08 07:04:50.85297+00
110	ACE698	LOGIN	t	\N	\N	2026-05-08 07:05:25.00928+00
111	ACE698	CHANGE_PASSWORD	t	\N	ACE698	2026-05-08 07:06:41.656032+00
112	ACE698	LOGIN	t	\N	\N	2026-05-08 07:06:46.408945+00
113	ACE692	LOGIN	f	Invalid password	\N	2026-05-08 07:07:13.90135+00
114	ACE692	LOGIN	f	Invalid password	\N	2026-05-08 07:07:26.595038+00
115	woraphatc.huawei@gmail.com	LOGIN	f	User not found	\N	2026-05-08 07:07:33.649411+00
116	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:07:41.631214+00
117	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:07:52.887429+00
118	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:07:56.741788+00
123	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:08:19.964145+00
136	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:13:20.031329+00
139	ace timesheet	LOGIN	f	User not found	\N	2026-05-08 07:16:04.916612+00
148	hr-001	LOGIN	f	Rate limited	\N	2026-05-08 07:19:43.648612+00
150	hr-001	LOGIN	f	Rate limited	\N	2026-05-08 07:19:53.794358+00
159	nitcha.b@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:22:30.840686+00
164	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:16.359768+00
169	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:17.348798+00
174	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:18.317655+00
179	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:19.374049+00
184	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:20.416536+00
189	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:21.519356+00
194	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:41.760474+00
119	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:08:00.405338+00
124	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:08:28.372983+00
126	ACE692	LOGIN	t	\N	\N	2026-05-08 07:08:54.425237+00
132	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:13:16.71525+00
137	ACE010	CHANGE_PASSWORD	t	\N	ACE010	2026-05-08 07:13:41.982811+00
140	ace timesheet	LOGIN	f	User not found	\N	2026-05-08 07:16:07.013568+00
142	nitcha.b@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:17:48.808199+00
145	chayaporn.s@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:19:08.700318+00
149	ACE292	CHANGE_PASSWORD	t	\N	ACE292	2026-05-08 07:19:48.056777+00
151	hr-001	LOGIN	f	Rate limited	\N	2026-05-08 07:19:55.97079+00
155	ACE292	LOGIN	t	\N	\N	2026-05-08 07:22:01.212855+00
156	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:22:10.982141+00
161	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:05.868461+00
166	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:16.771407+00
171	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:17.731368+00
176	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:18.736285+00
181	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:19.779516+00
186	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:20.836155+00
191	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:35.295951+00
120	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:08:01.567093+00
125	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:08:50.507735+00
128	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:11:56.158829+00
133	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:13:17.626257+00
141	nitcha.b@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:16:53.457697+00
143	ACE292	LOGIN	t	\N	\N	2026-05-08 07:18:12.357818+00
146	chayaporn.s@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:19:25.243649+00
152	hr-001	LOGIN	f	Rate limited	\N	2026-05-08 07:19:56.659461+00
157	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:22:24.046394+00
162	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:13.870211+00
167	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:16.981641+00
172	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:17.920841+00
177	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:18.946785+00
182	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:19.966677+00
187	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:21.069187+00
192	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:38.3114+00
121	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:08:17.047166+00
127	ACE692	CHANGE_PASSWORD	t	\N	ACE692	2026-05-08 07:09:37.233448+00
129	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:12:15.738807+00
134	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:13:18.687563+00
138	ACE010	LOGIN	t	\N	\N	2026-05-08 07:14:07.504985+00
153	hr-001	LOGIN	f	Rate limited	\N	2026-05-08 07:20:21.410028+00
158	nitcha.b@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:22:29.762445+00
163	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:16.150394+00
168	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:17.176981+00
173	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:18.113891+00
178	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:19.166321+00
183	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:20.192282+00
188	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:21.30196+00
193	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:40.900432+00
122	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:08:19.363549+00
130	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:12:17.10578+00
131	ACE010	LOGIN	t	\N	\N	2026-05-08 07:13:08.470873+00
135	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:13:19.517135+00
144	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:18:30.282653+00
147	็hr-001	LOGIN	f	Rate limited	\N	2026-05-08 07:19:33.173351+00
154	phmipat@airconnect-e.com	LOGIN	f	User not found	\N	2026-05-08 07:20:28.15623+00
160	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:22:46.239619+00
165	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:16.562295+00
170	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:17.543957+00
175	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:18.543302+00
180	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:19.585547+00
185	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:20.634258+00
190	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:26.917574+00
195	ACE292	LOGIN	t	\N	\N	2026-05-08 07:23:52.066535+00
196	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:53.119602+00
197	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:23:54.077338+00
198	ACE292	LOGIN	t	\N	\N	2026-05-08 07:24:29.936569+00
199	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:24:34.82626+00
200	ACE292	LOGIN	t	\N	\N	2026-05-08 07:24:38.785013+00
201	nattapon.sa@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:24:56.158527+00
202	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:25:41.460841+00
203	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:25:46.907362+00
204	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:25:47.500728+00
205	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:25:47.886912+00
206	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:25:48.050408+00
207	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:25:48.200712+00
208	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:26:25.701461+00
209	woraphat1100@gmail.com	LOGIN	f	Rate limited	\N	2026-05-08 07:30:10.026374+00
210	peerapol@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 07:32:26.261231+00
211	ACE056	LOGIN	t	\N	\N	2026-05-08 07:35:57.715147+00
212	ACE690	LOGIN	t	\N	\N	2026-05-08 07:37:45.939166+00
213	ADMIN	LOGIN	f	Invalid password	\N	2026-05-08 07:38:16.345628+00
214	ACE690	CHANGE_PASSWORD	t	\N	ACE690	2026-05-08 07:38:32.631253+00
215	ADMIN	LOGIN	t	\N	\N	2026-05-08 07:38:56.407028+00
216	ACE690	LOGIN	t	\N	\N	2026-05-08 07:39:02.191472+00
217	ACE692	LOGIN	t	\N	\N	2026-05-08 07:45:46.543943+00
218	AE194	LOGIN	t	\N	\N	2026-05-08 07:51:44.406129+00
219	AE194	CHANGE_PASSWORD	t	\N	AE194	2026-05-08 07:52:20.695637+00
220	AE194	LOGIN	f	Invalid password	\N	2026-05-08 07:52:33.896552+00
221	AE194	LOGIN	t	\N	\N	2026-05-08 07:52:40.059545+00
222	AE194	LOGIN	t	\N	\N	2026-05-08 07:52:48.317174+00
223	ACE652	LOGIN	t	\N	\N	2026-05-08 07:58:54.514015+00
224	ACE652	CHANGE_PASSWORD	t	\N	ACE652	2026-05-08 08:00:40.09608+00
225	ACE652	LOGIN	f	Invalid password	\N	2026-05-08 08:00:46.942698+00
226	ACE652	LOGIN	t	\N	\N	2026-05-08 08:00:51.191434+00
227	ACE692	LOGIN	t	\N	\N	2026-05-08 08:06:28.925048+00
228	k.pattaraphitak@gmail.com	LOGIN	f	User not found	\N	2026-05-08 08:11:15.350405+00
229	wattana@airconnect-e.com​	LOGIN	f	User not found	\N	2026-05-08 08:42:00.862535+00
230	wattana@airconnect-e.com​	LOGIN	f	User not found	\N	2026-05-08 08:43:17.562411+00
231	AE180	LOGIN	t	\N	\N	2026-05-08 08:43:56.492786+00
232	AE180	LOGIN	f	Invalid password	\N	2026-05-08 08:45:12.161346+00
233	AE180	LOGIN	f	Invalid password	\N	2026-05-08 08:45:26.397297+00
234	AE180	LOGIN	f	Invalid password	\N	2026-05-08 08:45:30.72781+00
235	AE180	LOGIN	f	Invalid password	\N	2026-05-08 08:45:32.332185+00
236	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:45:33.591902+00
237	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:46:04.114062+00
238	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:46:13.147982+00
239	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:46:14.472197+00
240	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:46:15.372345+00
241	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:46:32.537857+00
242	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:47:29.646683+00
243	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:47:32.310671+00
244	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:47:36.241881+00
245	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:47:39.426129+00
246	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:48:11.731119+00
247	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:48:12.801606+00
248	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:48:13.474831+00
249	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:48:13.650843+00
250	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:48:13.807357+00
251	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:48:13.940411+00
252	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:48:14.072201+00
253	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:48:14.205361+00
254	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:48:14.340893+00
255	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:48:14.480584+00
256	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:48:14.615342+00
257	wattana@airconnect-e.com	LOGIN	f	Rate limited	\N	2026-05-08 08:48:14.847644+00
258	ACECS430	LOGIN	f	Invalid password	\N	2026-05-08 10:32:14.635531+00
259	ACECS430	LOGIN	t	\N	\N	2026-05-08 10:35:09.076006+00
260	ACECS430	CHANGE_PASSWORD	t	\N	ACECS430	2026-05-08 10:36:14.023981+00
261	ACECS430	LOGIN	t	\N	\N	2026-05-08 10:36:47.144789+00
262	ADMIN	LOGIN	t	\N	\N	2026-05-08 16:02:39.300502+00
263	ACECS429	LOGIN	f	Invalid password	\N	2026-05-09 00:17:56.501589+00
264	ACECS429	LOGIN	f	Invalid password	\N	2026-05-09 00:18:46.766452+00
265	ACECS429	LOGIN	f	Invalid password	\N	2026-05-09 00:22:34.906971+00
266	ACECS429	LOGIN	f	Invalid password	\N	2026-05-09 00:25:13.739624+00
267	ACECS429	LOGIN	t	\N	\N	2026-05-09 00:26:30.305962+00
268	ACECS429	CHANGE_PASSWORD	t	\N	ACECS429	2026-05-09 00:27:50.149703+00
269	ACECS429	LOGIN	f	Invalid password	\N	2026-05-09 00:28:24.253457+00
270	anuwat.promt@gmail.com	LOGIN	f	Rate limited	\N	2026-05-09 00:29:02.689783+00
271	anuwat.promt@gmail.com	LOGIN	f	Rate limited	\N	2026-05-09 00:30:53.555515+00
272	anuwat.promt@gmail.com	LOGIN	f	Rate limited	\N	2026-05-09 00:30:56.596444+00
273	anuwat.promt@gmail.com	LOGIN	f	Rate limited	\N	2026-05-09 00:30:58.145148+00
274	kakmoonarak@gmail.com	LOGIN	f	User not found	\N	2026-05-09 01:02:51.16108+00
275	kakmoonarak@gmail.com	LOGIN	f	User not found	\N	2026-05-09 01:03:25.231722+00
276	k.pattaraphitak@gmail.com	LOGIN	f	User not found	\N	2026-05-09 01:03:55.455913+00
277	kakmoonarak@gmail.com	LOGIN	f	User not found	\N	2026-05-09 01:10:09.268989+00
278	k.pattaraphitak@gmail.com	LOGIN	f	User not found	\N	2026-05-09 01:16:59.533623+00
279	k.pattaraphitak@gmail.com	LOGIN	f	Rate limited	\N	2026-05-09 01:17:37.341061+00
280	k.pattaraphitak@gmail.com	LOGIN	f	Rate limited	\N	2026-05-09 01:17:44.020968+00
281	ACECS431	LOGIN	t	\N	\N	2026-05-09 01:47:08.022936+00
285	ADMIN	LOGIN	t	\N	\N	2026-05-09 03:17:04.773247+00
289	ADMIN	LOGIN	t	\N	\N	2026-05-09 04:37:02.498134+00
282	ACECS430	LOGIN	t	\N	\N	2026-05-09 01:51:44.982105+00
290	ADMIN	LOGIN	t	\N	\N	2026-05-09 04:38:12.63096+00
283	AECS224	LOGIN	t	\N	\N	2026-05-09 02:08:56.902432+00
284	ACECS429	LOGIN	f	Invalid password	\N	2026-05-09 02:23:20.837625+00
286	ADMIN	LOGIN	t	\N	\N	2026-05-09 04:01:49.246205+00
292	AECS224	LOGIN	t	\N	\N	2026-05-09 11:45:02.57335+00
287	ADMIN	LOGIN	t	\N	\N	2026-05-09 04:34:03.480456+00
288	ADMIN	LOGIN	f	Invalid password	\N	2026-05-09 04:36:51.587839+00
291	ACECS431	LOGIN	t	\N	\N	2026-05-09 10:46:58.371482+00
293	ACECS430	LOGIN	t	\N	\N	2026-05-09 12:40:13.981813+00
294	ADMIN	LOGIN	f	Invalid password	\N	2026-05-10 17:49:18.985278+00
295	ADMIN	LOGIN	t	\N	\N	2026-05-10 17:49:29.646351+00
\.


--
-- Data for Name: auth_login_logs; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.auth_login_logs (id, identifier, employee_code, ip_address, user_agent, success, failure_reason, created_at) FROM stdin;
1	admin	ADMIN	27.145.48.187	Python-urllib/3.14	t	\N	2026-05-07 19:05:45.029411+00
2	atthapol.bom@gmail.com	ACE-XLSX-012	27.145.48.187	Python-urllib/3.14	t	\N	2026-05-07 19:05:45.343609+00
3	atthapol@airconnect-e.com	\N	27.145.48.187	Python-urllib/3.14	f	user_not_found	2026-05-07 19:05:45.628911+00
4	admin	ADMIN	27.145.48.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-07 19:06:24.157664+00
5	admin	ADMIN	27.145.48.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-07 19:09:10.626816+00
6	admin	ADMIN	27.145.48.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-07 19:14:35.546578+00
7	admin	ADMIN	27.145.48.187	Python-urllib/3.14	t	\N	2026-05-07 19:15:23.58875+00
8	admin	ADMIN	27.145.48.187	Python-urllib/3.14	t	\N	2026-05-07 19:23:10.470457+00
9	admin	ADMIN	27.145.48.187	Python-urllib/3.14	t	\N	2026-05-07 19:24:30.659899+00
149	peerapol@airconnect-e.com	ACE056	124.122.158.190	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.100 Mobile/15E148 Safari/604.1	t	\N	2026-05-08 07:35:57.715147+00
150	woraphat1100@gmail.com	ACE690	124.122.158.190	Mozilla/5.0 (iPhone; CPU iPhone OS 26_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.100 Mobile/15E148 Safari/604.1	t	\N	2026-05-08 07:37:45.939166+00
21	peerapol@airconnect-e.com	ACE056	27.145.48.187	curl/8.18.0	t	\N	2026-05-07 19:42:21.685348+00
22	peerapol@airconnect-e.com	ACE056	27.145.48.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-07 19:42:53.066376+00
23	peerapol@airconnect-e.com	ACE056	27.145.48.187	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.100 Mobile/15E148 Safari/604.1	f	invalid_password	2026-05-07 19:43:08.48666+00
24	peerapol@airconnect-e.com	ACE056	27.145.48.187	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.100 Mobile/15E148 Safari/604.1	t	\N	2026-05-07 19:43:44.952554+00
25	admin	ADMIN	27.145.48.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	invalid_password	2026-05-07 19:44:22.544963+00
26	admin	ADMIN	27.145.48.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-07 19:44:40.224078+00
27	admin	ADMIN	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-08 05:54:58.881308+00
28	anong@airconnect-e.com	ACE174	49.230.228.112	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	f	invalid_password	2026-05-08 06:23:52.363978+00
29	anong@airconnect-e.com	ACE174	49.230.228.112	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	f	invalid_password	2026-05-08 06:24:15.483956+00
30	anong@airconnect-e.com	ACE174	49.230.228.112	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 06:24:32.92347+00
31	anong@airconnect-e.com	ACE174	49.230.228.112	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 06:26:41.403259+00
32	papontanai@hotmail.com	ACECS431	182.232.96.211	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-08 06:33:37.354445+00
33	papontanai@hotmail.com	ACECS431	182.232.96.211	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-08 06:36:08.763821+00
34	papontanai@hotmail.com	ACECS431	182.232.96.211	Mozilla/5.0 (iPhone; CPU iPhone OS 26_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.100 Mobile/15E148 Safari/604.1	t	\N	2026-05-08 06:37:09.414516+00
35	atthapol.bom@gmail.com	ACE-XLSX-012	171.6.16.4	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 06:37:46.073015+00
36	atthapol.bom@gmail.com	ACE-XLSX-012	124.122.158.190	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 06:38:05.132154+00
37	chainarong@airconnect-e.com	AE008	171.6.16.4	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	f	invalid_password	2026-05-08 06:40:21.494784+00
38	chainarong@airconnect-e.com	AE008	171.6.16.4	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	f	invalid_password	2026-05-08 06:40:24.336311+00
39	chainarong@airconnect-e.com	AE008	171.6.16.4	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	f	invalid_password	2026-05-08 06:40:26.474056+00
40	chainarong@airconnect-e.com	AE008	171.6.16.4	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 06:40:58.579816+00
41	chainarong@airconnect-e.com	AE008	171.6.16.4	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 06:42:16.960043+00
42	tipparat@airconnect-e.com	AE106	171.6.16.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	t	\N	2026-05-08 06:49:09.118133+00
43	tipparat@airconnect-e.com	AE106	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	t	\N	2026-05-08 06:51:08.521325+00
44	rungnapa@airconnect-e.com	ACE603	124.122.158.190	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/26.5.0	t	\N	2026-05-08 06:52:12.242478+00
45	tipparat@airconnect-e.com	AE106	49.229.216.220	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/26.5.0	t	\N	2026-05-08 06:52:27.526826+00
46	rungnapa@airconnect-e.com	ACE603	124.122.158.190	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/26.5.0	t	\N	2026-05-08 06:54:15.60286+00
47	yodsawee@airconnect-e.com	AECS224	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0	t	\N	2026-05-08 07:00:48.538597+00
48	yodsawee@airconnect-e.com	AECS224	124.122.158.190	Mozilla/5.0 (Linux; Android 15; 22081212UG Build/AQ3A.241006.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.111 Mobile Safari/537.36 Line/26.6.0/IAB	t	\N	2026-05-08 07:02:38.261191+00
51	yodsawee@airconnect-e.com	AECS224	171.6.16.4	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 07:04:50.85297+00
52	chayaporn.s@airconnect-e.com	ACE698	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	t	\N	2026-05-08 07:05:25.00928+00
53	chayaporn.s@airconnect-e.com	ACE698	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	t	\N	2026-05-08 07:06:46.408945+00
151	admin	ADMIN	171.6.16.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	invalid_password	2026-05-08 07:38:16.345628+00
152	admin	ADMIN	171.6.16.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-08 07:38:56.407028+00
169	wattana@airconnect-e.com	AE180	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	f	invalid_password	2026-05-08 08:45:30.72781+00
174	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:46:14.472197+00
77	atthapol@airconnect-e.com	ACE010	124.122.158.190	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 07:14:07.504985+00
179	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:47:36.241881+00
184	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:48:13.650843+00
189	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:48:14.340893+00
205	anuwat.promt@gmail.com	\N	182.232.70.48	Mozilla/5.0 (Linux; Android 14; CPH2625 Build/UKQ1.231108.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.5.0/IAB	f	rate_limited	2026-05-09 00:30:56.596444+00
209	k.pattaraphitak@gmail.com	\N	49.237.79.196	Mozilla/5.0 (Linux; Android 16; SM-A556E Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.6.1/IAB	f	user_not_found	2026-05-09 01:03:55.455913+00
213	k.pattaraphitak@gmail.com	\N	49.237.79.196	Mozilla/5.0 (Linux; Android 16; SM-A556E Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.6.1/IAB	f	rate_limited	2026-05-09 01:17:44.020968+00
220	admin	ADMIN	171.97.159.195	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-09 04:34:03.480456+00
221	admin	ADMIN	171.97.159.195	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	invalid_password	2026-05-09 04:36:51.587839+00
224	papontanai@hotmail.com	ACECS431	182.232.96.175	Mozilla/5.0 (iPhone; CPU iPhone OS 26_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.100 Mobile/15E148 Safari/604.1	t	\N	2026-05-09 10:46:58.371482+00
226	sakrapree@gmail.com	ACECS430	1.46.150.191	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/26.5.0	t	\N	2026-05-09 12:40:13.981813+00
153	woraphat1100@gmail.com	ACE690	124.122.158.190	Mozilla/5.0 (iPhone; CPU iPhone OS 26_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.100 Mobile/15E148 Safari/604.1	t	\N	2026-05-08 07:39:02.191472+00
155	nattapon.sa@airconnect-e.com	AE194	171.6.16.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	t	\N	2026-05-08 07:51:44.406129+00
157	nattapon.sa@airconnect-e.com	AE194	171.6.16.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	t	\N	2026-05-08 07:52:40.059545+00
159	boonsong.ns@airconnect-e.com	ACE652	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	t	\N	2026-05-08 07:58:54.514015+00
163	k.pattaraphitak@gmail.com	\N	27.55.83.202	Mozilla/5.0 (Linux; Android 16; SM-A556E Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.6.1/IAB	f	user_not_found	2026-05-08 08:11:15.350405+00
166	wattana@airconnect-e.com	AE180	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	t	\N	2026-05-08 08:43:56.492786+00
167	wattana@airconnect-e.com	AE180	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	f	invalid_password	2026-05-08 08:45:12.161346+00
172	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:46:04.114062+00
177	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:47:29.646683+00
182	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:48:12.801606+00
187	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:48:14.072201+00
192	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:48:14.847644+00
196	admin	ADMIN	27.145.48.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-08 16:02:39.300502+00
206	anuwat.promt@gmail.com	\N	182.232.70.48	Mozilla/5.0 (Linux; Android 14; CPH2625 Build/UKQ1.231108.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.5.0/IAB	f	rate_limited	2026-05-09 00:30:58.145148+00
210	kakmoonarak@gmail.com	\N	49.237.79.196	Mozilla/5.0 (Linux; Android 16; SM-A556E Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.6.1/IAB	f	user_not_found	2026-05-09 01:10:09.268989+00
214	papontanai@hotmail.com	ACECS431	184.22.114.247	Mozilla/5.0 (iPhone; CPU iPhone OS 26_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.100 Mobile/15E148 Safari/604.1	t	\N	2026-05-09 01:47:08.022936+00
218	admin	ADMIN	27.55.78.196	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.100 Mobile/15E148 Safari/604.1	t	\N	2026-05-09 03:17:04.773247+00
222	admin	ADMIN	171.97.159.195	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-09 04:37:02.498134+00
154	nitcha.b@airconnect-e.com	ACE692	171.6.16.4	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1	t	\N	2026-05-08 07:45:46.543943+00
156	nattapon.sa@airconnect-e.com	AE194	171.6.16.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	f	invalid_password	2026-05-08 07:52:33.896552+00
161	boonsong.ns@airconnect-e.com	ACE652	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	t	\N	2026-05-08 08:00:51.191434+00
67	nitcha.b@airconnect-e.com	ACE692	124.122.158.190	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1	t	\N	2026-05-08 07:08:54.425237+00
162	nitcha.b@airconnect-e.com	ACE692	124.122.158.190	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1	t	\N	2026-05-08 08:06:28.925048+00
168	wattana@airconnect-e.com	AE180	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	f	invalid_password	2026-05-08 08:45:26.397297+00
173	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:46:13.147982+00
178	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:47:32.310671+00
183	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:48:13.474831+00
93	phumipat@airconnect-e.com	ACE292	49.230.46.243	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 07:22:01.212855+00
188	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:48:14.205361+00
193	sakrapree@gmail.com	ACECS430	1.46.150.191	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/26.5.0	f	invalid_password	2026-05-08 10:32:14.635531+00
195	sakrapree@gmail.com	ACECS430	1.46.150.191	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1	t	\N	2026-05-08 10:36:47.144789+00
197	anuwat.promt@gmail.com	ACECS429	182.232.70.48	Mozilla/5.0 (Linux; Android 14; CPH2625 Build/UKQ1.231108.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.5.0/IAB	f	invalid_password	2026-05-09 00:17:56.501589+00
201	anuwat.promt@gmail.com	ACECS429	182.232.70.48	Mozilla/5.0 (Linux; Android 14; CPH2625 Build/UKQ1.231108.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.5.0/IAB	t	\N	2026-05-09 00:26:30.305962+00
207	kakmoonarak@gmail.com	\N	49.237.79.196	Mozilla/5.0 (Linux; Android 16; SM-A556E Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.6.1/IAB	f	user_not_found	2026-05-09 01:02:51.16108+00
211	k.pattaraphitak@gmail.com	\N	49.237.79.196	Mozilla/5.0 (Linux; Android 16; SM-A556E Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.6.1/IAB	f	user_not_found	2026-05-09 01:16:59.533623+00
215	sakrapree@gmail.com	ACECS430	182.232.94.133	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/26.5.0	t	\N	2026-05-09 01:51:44.982105+00
223	admin	ADMIN	171.97.159.195	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-09 04:38:12.63096+00
158	nattapon.sa@airconnect-e.com	AE194	171.6.16.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	t	\N	2026-05-08 07:52:48.317174+00
164	wattana@airconnect-e.com​	\N	124.122.158.190	Mozilla/5.0 (Linux; Android 16; SM-S908E Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.6.0/IAB	f	user_not_found	2026-05-08 08:42:00.862535+00
170	wattana@airconnect-e.com	AE180	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	f	invalid_password	2026-05-08 08:45:32.332185+00
175	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:46:15.372345+00
180	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:47:39.426129+00
185	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:48:13.807357+00
82	phumipat@airconnect-e.com	ACE292	49.230.46.243	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 07:18:12.357818+00
190	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:48:14.480584+00
194	sakrapree@gmail.com	ACECS430	1.46.150.191	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1	t	\N	2026-05-08 10:35:09.076006+00
198	anuwat.promt@gmail.com	ACECS429	182.232.70.48	Mozilla/5.0 (Linux; Android 14; CPH2625 Build/UKQ1.231108.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.5.0/IAB	f	invalid_password	2026-05-09 00:18:46.766452+00
219	admin	ADMIN	171.6.16.4	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-09 04:01:49.246205+00
160	boonsong.ns@airconnect-e.com	ACE652	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	f	invalid_password	2026-05-08 08:00:46.942698+00
165	wattana@airconnect-e.com​	\N	171.6.16.4	Mozilla/5.0 (Linux; Android 16; SM-S908E Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.6.0/IAB	f	user_not_found	2026-05-08 08:43:17.562411+00
171	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0	f	rate_limited	2026-05-08 08:45:33.591902+00
71	atthapol@airconnect-e.com	ACE010	124.122.158.190	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 07:13:08.470873+00
176	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:46:32.537857+00
181	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:48:11.731119+00
186	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:48:13.940411+00
191	wattana@airconnect-e.com	\N	124.122.158.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	rate_limited	2026-05-08 08:48:14.615342+00
199	anuwat.promt@gmail.com	ACECS429	182.232.70.48	Mozilla/5.0 (Linux; Android 14; CPH2625 Build/UKQ1.231108.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.5.0/IAB	f	invalid_password	2026-05-09 00:22:34.906971+00
202	anuwat.promt@gmail.com	ACECS429	182.232.70.48	Mozilla/5.0 (Linux; Android 14; CPH2625 Build/UKQ1.231108.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.5.0/IAB	f	invalid_password	2026-05-09 00:28:24.253457+00
227	admin	ADMIN	27.145.48.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	f	invalid_password	2026-05-10 17:49:18.985278+00
228	admin	ADMIN	27.145.48.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	t	\N	2026-05-10 17:49:29.646351+00
200	anuwat.promt@gmail.com	ACECS429	182.232.70.48	Mozilla/5.0 (Linux; Android 14; CPH2625 Build/UKQ1.231108.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.5.0/IAB	f	invalid_password	2026-05-09 00:25:13.739624+00
133	phumipat@airconnect-e.com	ACE292	49.230.46.243	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 07:23:52.066535+00
203	anuwat.promt@gmail.com	\N	182.232.70.48	Mozilla/5.0 (Linux; Android 14; CPH2625 Build/UKQ1.231108.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.5.0/IAB	f	rate_limited	2026-05-09 00:29:02.689783+00
136	phumipat@airconnect-e.com	ACE292	49.230.46.243	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 07:24:29.936569+00
204	anuwat.promt@gmail.com	\N	182.232.70.48	Mozilla/5.0 (Linux; Android 14; CPH2625 Build/UKQ1.231108.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.5.0/IAB	f	rate_limited	2026-05-09 00:30:53.555515+00
208	kakmoonarak@gmail.com	\N	49.237.79.196	Mozilla/5.0 (Linux; Android 16; SM-A556E Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.6.1/IAB	f	user_not_found	2026-05-09 01:03:25.231722+00
138	phumipat@airconnect-e.com	ACE292	49.230.46.243	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	t	\N	2026-05-08 07:24:38.785013+00
212	k.pattaraphitak@gmail.com	\N	49.237.79.196	Mozilla/5.0 (Linux; Android 16; SM-A556E Build/BP2A.250605.031.A3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.6.1/IAB	f	rate_limited	2026-05-09 01:17:37.341061+00
216	yodsawee@airconnect-e.com	AECS224	49.237.83.234	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	t	\N	2026-05-09 02:08:56.902432+00
217	anuwat.promt@gmail.com	ACECS429	182.232.70.24	Mozilla/5.0 (Linux; Android 14; CPH2625 Build/UKQ1.231108.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/147.0.7727.137 Mobile Safari/537.36 Line/26.5.0/IAB	f	invalid_password	2026-05-09 02:23:20.837625+00
225	yodsawee@airconnect-e.com	AECS224	171.97.159.195	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	t	\N	2026-05-09 11:45:02.57335+00
\.


--
-- Data for Name: auth_users; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.auth_users (id, employee_code, password_hash, first_name, last_name, email, department, team, position_code, position_name, clock_type, gps_required, photo_required, work_lat, work_lng, work_location_name, allowed_radius_m, role, must_change_password, failed_login_count, locked_until, last_login_at, password_changed_at, created_by, is_active, created_at, updated_at, token_version) FROM stdin;
4	PM-001	$2b$12$ZnZQuXx3lJQthBtnBgvH7uLtpq8Aih93.wVbltKCghodVvaFx.xjO	Project	Admin	project@airconnect-e.com	Project	Project Management	PROJECT_ADMIN	Project Administrator	DAILY	f	f	13.7563	100.5018	ACE Head Office	300	PROJECT_ADMIN	f	0	\N	\N	2026-05-07 10:42:28.41826+00	\N	t	2026-05-07 10:42:27.576241+00	2026-05-07 10:42:27.576241+00	1
3	HR-001	$2b$12$NFdjn5bpv9qOwPY9cEcLMevWEQPpJo1J83JDpFNjzzWsTG40GRIpO	HR	Admin	hr@airconnect-e.com	Human Resources	People Operations	HR	HR Administrator	DAILY	f	f	13.7563	100.5018	ACE Head Office	300	HR_ADMIN	f	0	\N	2026-05-07 13:30:38.311267+00	2026-05-07 10:42:28.21638+00	\N	t	2026-05-07 10:42:27.576241+00	2026-05-07 13:30:38.310853+00	1
15	ACE-XLSX-003	$2b$12$poCol/QWVwQbLZ.KrO22BO9uXp4ebGXfIYbtqubZtR3N07wNBLk9y	Phumipat	Yupracham	phumipat38@gmail.com	Project	\N	RF	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-07 14:03:15.075117+00	2026-05-07 13:32:04.29199+00	\N	t	2026-05-07 11:14:40.007641+00	2026-05-07 14:03:15.074648+00	1
19	ACE-XLSX-011	$2b$12$poCol/QWVwQbLZ.KrO22BO9uXp4ebGXfIYbtqubZtR3N07wNBLk9y	Sajja	Kaengkan	skangkan@gmail.com	Project	\N	RF	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	2026-05-07 13:38:32.992072+00	2026-05-07 11:14:41.460137+00	\N	t	2026-05-07 11:14:41.460137+00	2026-05-07 13:38:32.991617+00	1
50	AECS228	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Sukreephon	Maichum	Sukreephon_maichum@hotmail.com	Project	RF	OTHER	OMC Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
1	ADMIN	$2b$12$WhveiZ/yLot7bBFtJlEPu.SATEZNvTuk0yErtEKx2MMD7qPeD0YVa	ACE	Admin	peerapol1430@gmail.com	Management	System Administration	ADMIN	System Administrator	DAILY	f	f	13.7563	100.5018	ACE Head Office	300	SUPER_ADMIN	f	0	\N	2026-05-10 17:49:29.649566+00	2026-05-07 10:42:27.800742+00	\N	t	2026-05-07 10:42:27.576241+00	2026-05-10 17:49:29.646351+00	1
52	AECS279	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Akkarawut	Promriew	Hdyuyryom@gmail.com	Project	TE	OTHER	Rigger	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
35	ACE652	$2b$12$tuW955u/qcaRXWZHkilJIOkL8o94z3ntN2Ay6shetTP4Hi6.Q3ZYW	Boonsong	Nisap	Boonsong.ns@airconnect-e.com	Project	Enterprise	OTHER	Site Solution	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-08 08:00:51.194521+00	2026-05-08 08:00:40.500896+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 08:00:51.191434+00	2
26	ACE125	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Ananchai	Mittha	Ananchai@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
28	ACE246	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Porntip	Chotchaug	Tip83574@gmail.com	HR	HQ	OTHER	Maid	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
34	ACE630	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Artit	Malawaichan	Artit.m@airconnect-e.com	Project	PM	OTHER	Senior Systems Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
36	ACECS002	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Sajja	Kaengkan	Sajja@airconnect-e.com	Project	RF	OTHER	Project Manager	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
38	AE013	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Thachatham	Monton	Thachatham@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
53	AECS298	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Paksiri	Khattiset	Puksiri.kha@airconnect-e.com	Project	Enterprise	OTHER	Inventory Management	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
40	AE129	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Peerayu	Chunlaphan	Peerayu@airconnect-e.com	Project	Enterprise	OTHER	Site Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
54	ACECS286	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Kankanit	Suwannathorn	Kankanit.suw@airconnect-e.com	HR	HR	OTHER	HR Coordinator	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
55	ACE685	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Keattichai	Konggun	Keattichai.kon@airconnect-e.com	HR	HR	OTHER	HR Labor Relations	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
58	AE196	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Thitipong	Promtrirat	Thitipong.Pro@airconnect-e.com	Accounting	Finance	OTHER	Accounting Officer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
42	AE152	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Somphon	Wongwattanagonchai	Beesomphon@gmail.com	Project	TE	OTHER	Store Officer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
43	AE180	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Wathana	Lamoon	Wattana@airconnect-e.com	Project	PM	OTHER	Senior Project Manager	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	4	\N	2026-05-08 08:43:56.495677+00	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
46	AECS212	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Thanachai	Mothong	Hs3pol@gmail.com	Project	RF	OTHER	Rigger	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
59	AECS357	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Krittasin	Duangta	Krittasin.dua@airconnect-e.com	Project	RF	OTHER	Project Manager	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
61	AE201	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Pimwaree	Sriwun	Pimwaree.s@advance-e.net	Accounting	Finance	OTHER	Accounting Officer (Cambodia Support)	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
62	AE202	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Sasivimon	Phoraksa	Sasivimol.p@airconnect-e.com	HR	HR	OTHER	HR Recruiter	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
57	ACE690	$2b$12$AdfkkdsS5/avL3FVfl4/L.5Oz1zkD0u4Ip9.WEaKuvvYCCaEtoEG.	Woraphat	Chery	Woraphat1100@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	f	0	\N	2026-05-08 07:39:02.194777+00	2026-05-08 07:38:33.035546+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 07:39:02.191472+00	2
44	AE192	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Packaphon	Maythamongkolkate	Packaphon.May@airconnect-e.com	Project	Enterprise	OTHER	Site Supervisor	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
48	ACECS401	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Kidsakon	Deeprasert	Kidsakond.huawei@gmail.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
49	ACECS403	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Panut	Pang-nga	panut.png@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
51	ACECS258	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Chirasak	Wongphapa	Jeerasakwongphapa@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
56	AECS343	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Metinee	Boonkerd	metineeb.huawei@gmail.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
60	AECS359	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Chetsada	Thauaonsang	Jatsada.me@gmail.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
64	ACECS404	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Prasittipon	Ployphum	Prasittipon.pp@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
65	ACECS406	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Payonrat	Phothiwat	Payonrat.jub.rf@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
66	ACE693	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Thaweephong	Thumphung	thaweephong.t@airconnect-e.com	AI	AI	OTHER	Senior Software Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
67	ACE694	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Ravit	Anuvongnukroh	ravit.a@airconnect-e.com	AI	AI	OTHER	Project Manager	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
68	AE204	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Suriya	Chareeun	tengteng0153@gmail.com	HR	HQ	OTHER	Messenger	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
69	ACE696	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Thammanoon	Malaicharoen	thammanoon.m@airconnect-e.com	AI	AI	OTHER	Software Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
70	ACE697	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Poommanat	Darachalermkul	poommanat.d@airconnect-e.com	AI	AI	OTHER	Software Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
71	ACECS384	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Thanawut	Kuwangkadilok	Chanton225@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
72	ACECS385	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Sasikarn	Boot-ngarm	Sasikarn.b@airconnect-e.com	Project	Enterprise	OTHER	Safety Officer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
73	AE205	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Tugsadon	Bovontanaphaisai	Tugsadon@airconnect-e.com	HR	HQ	OTHER	IT Support	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
74	ACECS386	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Jukkraphon	Meechai	jukkraphon.mee@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis​ Engineer/TL	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
75	ACECS388	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Lin	Saleepan	lin.sal@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
76	ACECS389	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Sulimat	Sonain	sulimat.son@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
77	ACECS390	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Phudit	Chuadnuch	phudit.chu@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
78	ACECS392	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Pawaran	Puyati	pawaran.puy@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
79	ACECS393	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Chonlada	Boonchottiphong	chonlada.boo@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
80	ACECS394	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Kunwadee	Hoi-mala	kunwadee.hoi@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
81	ACECS395	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Wuttisit	Seewasao	wuttisit.see@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
82	ACECS396	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Phonlawat	Khwanthong	phonlawat.kwa@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
83	ACECS397	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Patsakorn	Witenjit	Macdrums78@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
84	ACECS398	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Chokchai	Chinnarach	chokzee.cc@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
86	ACECS400	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Thanaphong	Triphanitkun	thanaphongtri@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
87	ACECS407	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Panukon	Sonsinpong	Yuiyuiyui803@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
21	ACE001	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Seng	Bun Lay	Bunlay.seng@airconnect-e.com	Executive	HQ	OTHER	Managing Director	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
45	AE194	$2b$12$fZuUOLnR3aoJcUQRV5bY.edSZc.P8OtJxX6EsjQG0mPvxY9rKL6d2	Nattapon	Sangtienprapai	Nattapon.sa@airconnect-e.com	Project	TE	OTHER	Project Manager	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-08 07:52:48.319891+00	2026-05-08 07:52:21.099986+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 07:52:48.317174+00	2
29	ACE292	$2b$12$WUj1KbJiSZkkvgbdHBAKuuMzbJdQnLbNQsqnas/fRDFPS6ydKfl0K	Phumipat	Yupracham	Phumipat@airconnect-e.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-08 07:24:38.7879+00	2026-05-08 07:19:48.467997+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 07:24:38.785013+00	2
2	ACE056	$2b$12$FucjycOWGomOQQmWjaARm.cZ6whGttJ4VCFt84AxgpIo1ny0udZL.	Peerapol	Piamsri	Peerapol@airconnect-e.com	Project Management	RF Team	PM	Project Manager	DAILY	f	f	13.7563	100.5018	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-08 07:35:57.718064+00	2026-05-07 10:42:28.014739+00	\N	t	2026-05-07 10:42:27.576241+00	2026-05-08 07:35:57.715147+00	1
22	ACE005	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Phannarai	Phagasri	Phannarai@airconnect-e.com	HR	HQ	OTHER	General Admin Manager	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
16	ACE-XLSX-012	$2b$12$poCol/QWVwQbLZ.KrO22BO9uXp4ebGXfIYbtqubZtR3N07wNBLk9y	Atthapol	Ruangboot	atthapol.bom@gmail.com	Project	\N	RF	Senior Project Manager	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-08 06:38:05.135057+00	2026-05-07 13:21:46.605721+00	\N	t	2026-05-07 11:14:40.35301+00	2026-05-08 06:38:05.132154+00	1
23	ACE009	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Narong	Saemaphakdee	Narong@airconnect-e.com	Project	PM	OTHER	Project Director	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
27	ACE174	$2b$12$EhKgM6Rd2xHYUbLQk1pa9OWWNN5PgmtL54WRtuPtEDNtGBffqjwvu	Anong	Jantaraeng	Anong@airconnect-e.com	Accounting	Finance	OTHER	Finance Officer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-08 06:26:41.405826+00	2026-05-08 06:26:26.21798+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 06:26:41.403259+00	2
31	ACE618	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Sujitra	Khuenkhiao	Sujitra@airconnect-e.com	Project	TE	OTHER	Report Preparation Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
17	ACE-XLSX-021	$2b$12$poCol/QWVwQbLZ.KrO22BO9uXp4ebGXfIYbtqubZtR3N07wNBLk9y	Yodsawee	Khawsri	yodsaweek.huawei@gmail.com	Project	\N	RF	Team Leader	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	2	\N	2026-05-07 13:38:31.793849+00	2026-05-07 11:14:40.662103+00	\N	t	2026-05-07 11:14:40.662103+00	2026-05-08 07:04:31.059059+00	1
32	ACE623	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Wachara	Boonthai	Wachara@airconnect-e.com	Project	TE	OTHER	Report Preparation Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
18	ACE-XLSX-031	$2b$12$poCol/QWVwQbLZ.KrO22BO9uXp4ebGXfIYbtqubZtR3N07wNBLk9y	Wathana	Lamoon	bangvela@gmail.com	Project	\N	TE	Senior Project Manager	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	2026-05-07 13:38:32.391522+00	2026-05-07 11:14:41.095168+00	\N	t	2026-05-07 11:14:41.095168+00	2026-05-07 13:38:32.391023+00	1
89	ACE698	$2b$12$.1/G/SNQ8NAPdlfXFmvnkOoVQ0U8nXYupSYRlVCboecAxaPgG66sO	Chayaporn	Suchaiya	Chayaporn.s@airconnect-e.com	HR	HR	OTHER	HR and Admin Manager	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-08 07:06:46.411368+00	2026-05-08 07:06:42.076022+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 07:06:46.408945+00	2
33	ACE624	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Bandasak	Sukpheng	Bandasak@airconnect-e.com	Project	PM	OTHER	Senior Site Supervisor	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
110	ACECS431	$2b$12$CTj2qiEBN54UB65haApDBO58iX0HSpXnW.OwUbhd0W2/S8uPDrPrK	Papontanai	Amnouysawatchai	papontanai@hotmail.com	Project	TE	OTHER	Project Coordinator and Store Officer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-09 10:46:58.38179+00	2026-05-08 06:36:03.812403+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-09 10:46:58.371482+00	2
47	AECS224	$2b$12$BEmrbV1NoQev647i8DxPVeij1f7KIMJ0.0aaupJy4gzTpef5n3Xv2	Yodsawee	Khawsri	Yodsawee@airconnect-e.com	Project	RF	OTHER	Team Leader	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-09 11:45:02.577127+00	2026-05-08 07:01:49.669934+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-09 11:45:02.57335+00	2
109	ACECS430	$2b$12$EaXaRrH2wlHn4lH7mXsuyeYRoXa8YeyoxpuANTXz91X9DLDIpTgty	Sakraphi	Champapho	sakrapree@gmail.com	Project	TE	OTHER	Team Leader	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-09 12:40:13.984589+00	2026-05-08 10:36:14.427363+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-09 12:40:13.981813+00	2
24	ACE010	$2b$12$6t6LbH1EB2cZCPcKqG5k9ussJvf1aCdI9.djMIzj1GfAmmZ4/AwYy	Atthapol	Ruangboot	Atthapol@airconnect-e.com	Project	PM	OTHER	Senior Project Manager	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-08 07:14:07.507891+00	2026-05-08 07:13:42.387285+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 07:14:07.504985+00	2
37	AE008	$2b$12$HPKrfLH6ZVmOl8y7aTp0euQYCo7PTPTHiytEiaQygdRj4wUvjLWqu	Chainarong	Songsee	Chainarong@airconnect-e.com	Project	TE	OTHER	Site Supervisor	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-08 06:42:16.963366+00	2026-05-08 06:41:44.757949+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 06:42:16.960043+00	2
30	ACE603	$2b$12$TiOJ1BQL43xqgw842iPyHeLCHbpNCndrUl7Oe0SvU4TY08qtRfMFa	Rungnapa	Pangkaew	Rungnapa@airconnect-e.com	Accounting	Finance	OTHER	Accounting and Finance Manager	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-08 06:54:15.605477+00	2026-05-08 06:53:48.873028+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 06:54:15.60286+00	2
39	AE106	$2b$12$9vZDECvOYXQS1byUhxAFfekTuhTO/tNyg31XSoyvTooCpcm/o6eRa	Tipparat	Buntaweelert	Tipparat@airconnect-e.com	Project	PM	OTHER	RF Project Admin	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-08 06:52:27.529113+00	2026-05-08 06:50:37.336063+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 06:52:27.526826+00	2
63	ACE692	$2b$12$T8EMPbLt0dJBe1TR7QdDC.eQtCWjHNUmU0go0xr1UsUne1v.aQ2f2	Nitcha	Buanak	Nitcha.b@airconnect-e.com	Executive	HQ	OTHER	Secretary	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	0	\N	2026-05-08 08:06:28.927464+00	2026-05-08 07:09:37.648239+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 08:06:28.925048+00	2
41	AE151	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Rattana	Kerdprakob	Rattana.kpk@airconnect-e.com	Project	TE	OTHER	Report Preparation Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
85	ACECS399	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Pathanin	Neampiboon	Pathanin2538@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
88	ACECS408	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Panuwat	Piwngam	panuwat.phiw@gmail.com	Project	RF	OTHER	Drive Test Analysis Engineer	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
90	ACE699	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Pornpimon	Chardram	Pornpimon.chard@airconnect-e.com	HR	HQ	OTHER	Purchasing Specialist	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
91	ACECS410	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Kittiphong	Wongsakul	kittiphong.psauto@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
92	ACECS411	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Wilairat	Khantikool	Wilairat.Khan@airconnect-e.com	BD	BD	OTHER	Sales Manager	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
93	ACECS412	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Nattdanai	Kittaponsakun	Fangfyhunter@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
94	ACECS413	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Niramol	Kuldilok	Niramol.huawei@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
95	ACECS414	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Wuttinan	Wongwut	Wuttinan.wongwut@gmail.com	Project	RF	OTHER	Rf Professional L2	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
96	ACECS415	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Ponlawat	Sangdanjak	Ponrawat1996@gmail.com	Project	RF	OTHER	Rf Professional L2	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
97	ACECS416	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Jantira	Prathumwong	Zom.jantira04@gmail.com	Project	RF	OTHER	Rf Professional L2	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
98	ACECS417	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Sutnatie	Boonyalekha	Sutnatie@gmail.com	Project	RF	OTHER	Rf Professional L3	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
99	ACECS418	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Suwanna	Pradittara	Suwanna.pradittara@gmail.com	Project	RF	OTHER	Rf Professional L3	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
100	ACECS419	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Taned	Yusabai	Taned79@gmail.com	Project	RF	OTHER	Drive Test Engineer	PER_SITE	t	t	\N	\N	\N	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
101	ACECS420	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Tippawan	Lonarai	lonaraiwaew@gmail.com	Project	RF	OTHER	Rf Professional L2	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
102	ACECS421	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Sastra	Thongmak	Sas_pnp@hotmail.com	Project	RF	OTHER	Rf Professional L3	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
103	ACE700	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Chotika	Pimpisan	Chotika.p@airconnect-e.com	Accounting	Finance	OTHER	Senior Accountant	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
104	ACECS425	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Thanakit	Bunrak	thanakit1986boo@gmail.com	Project	RF	OTHER	RF Professional L2	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
105	ACECS426	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Somchai	Klinhomsophon	somchaiklinhomsophon@gmail.com	Project	RF	OTHER	RF Professional L2	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
106	ACECS427	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Kriangkaisit	Meekhun	kriangkaisit@outlook.com	Project	RF	OTHER	RF Professional L2	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
107	ACECS428	$2b$12$.rX8GuUrjKRYSluXmEbFD.fsSU3nYOioKUlYoFlWiRXvJnTtyG5CC	Saranya	Tonohueng	sarany21012535@gmail.com	Project	TE	OTHER	Team Leader	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	t	0	\N	\N	2026-05-07 19:29:47.566265+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-08 16:11:19.126855+00	1
108	ACECS429	$2b$12$AJB.C0rPkQHr9WmMQZVvrOVA0eA35oTK/qdZo09ZlcNnTb//rDAHq	Anuwat	Ramring	Anuwat.promt@gmail.com	Project	TE	OTHER	Team Leader	DAILY	f	f	13.759246791410696	100.56849680127857	ACE Head Office	300	EMPLOYEE	f	2	\N	2026-05-09 00:26:30.308619+00	2026-05-09 00:27:50.557187+00	\N	t	2026-05-07 19:29:47.566265+00	2026-05-09 02:23:20.837625+00	2
\.


--
-- Data for Name: clock_sessions; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.clock_sessions (id, employee_code, user_id, clock_type, work_date, site_id, site_code, site_name, clock_in_at, lat_in, lng_in, photo_in, clock_out_at, lat_out, lng_out, photo_out, status, created_at) FROM stdin;
1	ACE056	2	DAILY	2026-05-07	\N	\N	\N	2026-05-07 11:22:18.021699+00	13.758922789859676	100.56852922609733	/photos/clock/ACE056_in_20260507_112218.jpg	\N	\N	\N	\N	ACTIVE	2026-05-07 11:22:18.020866+00
2	ACE-XLSX-012	16	DAILY	2026-05-07	\N	\N	\N	2026-05-07 14:01:05.979105+00	13.7587906	100.5683796	/photos/clock/ACE-XLSX-012_in_20260507_140105.jpg	\N	\N	\N	\N	ACTIVE	2026-05-07 14:01:05.978315+00
3	ACE-XLSX-003	15	DAILY	2026-05-07	\N	\N	\N	2026-05-07 14:03:42.999275+00	13.7588107	100.5683465	/photos/clock/ACE-XLSX-003_in_20260507_140342.jpg	\N	\N	\N	\N	ACTIVE	2026-05-07 14:03:42.998905+00
4	ACE174	27	DAILY	2026-05-08	\N	\N	\N	2026-05-08 06:27:22.784488+00	13.7588422	100.568386	/photos/clock/ACE174_in_20260508_062722.jpg	\N	\N	\N	\N	ACTIVE	2026-05-08 06:27:22.779209+00
5	ACE-XLSX-012	16	DAILY	2026-05-08	\N	\N	\N	2026-05-08 06:39:47.026507+00	13.7588457	100.568389	/photos/clock/ACE-XLSX-012_in_20260508_063947.jpg	\N	\N	\N	\N	ACTIVE	2026-05-08 06:39:47.024785+00
6	AE008	37	DAILY	2026-05-08	\N	\N	\N	2026-05-08 06:42:30.461576+00	13.7592255	100.5691213	/photos/clock/AE008_in_20260508_064230.jpg	2026-05-08 06:46:26.974226+00	13.7588084	100.56836	/photos/clock/AE008_out_20260508_064626.jpg	COMPLETE	2026-05-08 06:42:30.460175+00
7	ACECS431	110	DAILY	2026-05-08	\N	\N	\N	2026-05-08 06:47:13.754492+00	17.659226661997614	101.75796303502328	/photos/clock/ACECS431_in_20260508_064713.jpg	2026-05-08 06:48:35.554171+00	17.659207759751585	101.75793815508055	/photos/clock/ACECS431_out_20260508_064835.jpg	COMPLETE	2026-05-08 06:47:13.752336+00
9	AE106	39	DAILY	2026-05-08	\N	\N	\N	2026-05-08 06:52:59.164+00	13.75890106645057	100.5685513009876	/photos/clock/AE106_in_20260508_065259.jpg	\N	\N	\N	\N	ACTIVE	2026-05-08 06:52:59.162133+00
10	ACE603	30	DAILY	2026-05-08	\N	\N	\N	2026-05-08 06:55:06.0873+00	13.758812647337	100.56845017817798	/photos/clock/ACE603_in_20260508_065506.jpg	\N	\N	\N	\N	ACTIVE	2026-05-08 06:55:06.085598+00
12	ACE010	24	DAILY	2026-05-08	\N	\N	\N	2026-05-08 07:14:46.036635+00	13.7588436	100.5683933	/photos/clock/ACE010_in_20260508_071446.jpg	\N	\N	\N	\N	ACTIVE	2026-05-08 07:14:46.034825+00
13	ACE056	2	DAILY	2026-05-08	\N	\N	\N	2026-05-08 07:37:42.168412+00	13.758917429868527	100.56856972571832	/photos/clock/ACE056_in_20260508_073742.jpg	\N	\N	\N	\N	ACTIVE	2026-05-08 07:37:42.166346+00
14	ACE692	63	DAILY	2026-05-08	\N	\N	\N	2026-05-08 07:49:04.752908+00	13.758890721278773	100.5685230809543	/photos/clock/ACE692_in_20260508_074904.jpg	\N	\N	\N	\N	ACTIVE	2026-05-08 07:49:04.75118+00
15	ACE690	57	DAILY	2026-05-08	\N	\N	\N	2026-05-08 09:37:49.434931+00	13.758805365931394	100.56846115518088	/photos/clock/ACE690_in_20260508_093749.jpg	2026-05-08 09:38:51.997746+00	13.758805365931394	100.56846115518088	/photos/clock/ACE690_out_20260508_093851.jpg	COMPLETE	2026-05-08 09:37:49.433216+00
16	ACECS430	109	DAILY	2026-05-08	\N	\N	\N	2026-05-08 10:37:23.882988+00	16.44154166365363	103.52168585886234	/photos/clock/ACECS430_in_20260508_103723.jpg	2026-05-08 10:39:13.810581+00	16.441535187947167	103.52168633328691	/photos/clock/ACECS430_out_20260508_103913.jpg	COMPLETE	2026-05-08 10:37:23.881257+00
8	ACECS431	110	DAILY	2026-05-08	\N	\N	\N	2026-05-08 06:49:33.233862+00	17.659207759751585	101.75793815508055	/photos/clock/ACECS431_in_20260508_064933.jpg	2026-05-08 10:41:18.929058+00	17.65931673436801	101.7579255164679	/photos/clock/ACECS431_out_20260508_104118.jpg	COMPLETE	2026-05-08 06:49:33.231843+00
11	AECS224	47	DAILY	2026-05-08	\N	\N	\N	2026-05-08 07:05:15.811365+00	13.7588332	100.56837	/photos/clock/AECS224_in_20260508_070515.jpg	2026-05-08 11:08:50.74049+00	13.7587865	100.5684746	/photos/clock/AECS224_out_20260508_110850.jpg	COMPLETE	2026-05-08 07:05:15.809707+00
18	ACECS431	110	DAILY	2026-05-09	\N	\N	\N	2026-05-09 01:58:00.919521+00	17.48698315769557	101.72903784025041	/photos/clock/ACECS431_in_20260509_015800.jpg	2026-05-09 10:47:14.657269+00	17.495599188917737	101.72155811528802	/photos/clock/ACECS431_out_20260509_104714.jpg	COMPLETE	2026-05-09 01:58:00.917257+00
19	AECS224	47	DAILY	2026-05-09	\N	\N	\N	2026-05-09 02:09:19.195401+00	13.7587291	100.568334	/photos/clock/AECS224_in_20260509_020919.jpg	2026-05-09 11:45:18.934094+00	13.7588118	100.5683275	/photos/clock/AECS224_out_20260509_114518.jpg	COMPLETE	2026-05-09 02:09:19.193233+00
17	ACECS430	109	DAILY	2026-05-09	\N	\N	\N	2026-05-09 01:52:08.994835+00	16.68639364716812	103.7692520597727	/photos/clock/ACECS430_in_20260509_015208.jpg	2026-05-09 12:40:25.703099+00	16.42696871105992	103.52140071752046	/photos/clock/ACECS430_out_20260509_124025.jpg	COMPLETE	2026-05-09 01:52:08.98902+00
\.


--
-- Data for Name: clock_sites; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.clock_sites (id, site_code, site_name, customer, project_code, lat, lng, gps_radius_m, is_active, created_at) FROM stdin;
1	SITE-AIS-BKK-0421	Sukhumvit 21	AIS	AIS2601	13.7433	100.5588	500	t	2026-05-07 10:42:28.455629+00
2	SITE-AIS-BKK-0422	Asok BTS Area	AIS	AIS2601	13.7456	100.5602	300	t	2026-05-07 10:42:28.455629+00
3	SITE-TRUE-NNT-0118	Nonthaburi Tower	TRUE	HWT2306	13.8591	100.5134	500	t	2026-05-07 10:42:28.455629+00
4	SITE-AIS-RYG-0055	Rangsit Tower	AIS	NBTC2501	14.0233	100.6177	400	t	2026-05-07 10:42:28.455629+00
5	SITE-DTAC-BKK-0201	Silom Center	DTAC	HWT2301	13.7234	100.526	400	t	2026-05-07 10:42:28.455629+00
6	SITE-NT-CNX-0031	Chiangmai NT Tower	NT	WW2503	18.7883	98.9853	600	t	2026-05-07 10:42:28.455629+00
\.


--
-- Data for Name: email_outbox; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.email_outbox (id, recipient, subject, body_text, body_html, status, provider, error_code, error_message, attempts, sent_at, created_at, updated_at) FROM stdin;
1	peerapol@airconnect-e.com	ACE System SMTP Test	SMTP test from ACE System.\n\nApp URL: https://ace.airconnect-e.com	<p>SMTP test from <b>ACE System</b>.</p><p>App URL: https://ace.airconnect-e.com</p>	SENT	ACE Mail	\N	\N	1	2026-05-07 10:53:58.943356+00	2026-05-07 10:53:58.496344+00	2026-05-07 10:53:58.496344+00
2	peerapol.p@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">peerapol.p@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	FAILED	ACE Mail	SMTP_SEND_FAILED	{'peerapol.p@airconnect-e.com': (550, b'5.1.1 <peerapol.p@airconnect-e.com>: Recipient address rejected: User unknown in virtual mailbox table')}	1	\N	2026-05-07 19:17:40.722331+00	2026-05-07 19:17:40.722331+00
3	peerapol.p@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">peerapol.p@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	FAILED	ACE Mail	SMTP_SEND_FAILED	{'peerapol.p@airconnect-e.com': (550, b'5.1.1 <peerapol.p@airconnect-e.com>: Recipient address rejected: User unknown in virtual mailbox table')}	1	\N	2026-05-07 19:17:47.040154+00	2026-05-07 19:17:47.040154+00
4	peerapol.p@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">peerapol.p@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	FAILED	ACE Mail	SMTP_SEND_FAILED	{'peerapol.p@airconnect-e.com': (550, b'5.1.1 <peerapol.p@airconnect-e.com>: Recipient address rejected: User unknown in virtual mailbox table')}	1	\N	2026-05-07 19:17:56.303366+00	2026-05-07 19:17:56.303366+00
5	peerapol.p@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">peerapol.p@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	FAILED	ACE Mail	RECIPIENT_REJECTED	peerapol.p@airconnect-e.com: 5.1.1 <peerapol.p@airconnect-e.com>: Recipient address rejected: User unknown in virtual mailbox table	1	\N	2026-05-07 19:19:50.180695+00	2026-05-07 19:19:50.180695+00
6	peerapol.p@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">peerapol.p@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	FAILED	ACE Mail	RECIPIENT_REJECTED	peerapol.p@airconnect-e.com: 5.1.1 <peerapol.p@airconnect-e.com>: Recipient address rejected: User unknown in virtual mailbox table	1	\N	2026-05-07 19:20:00.886978+00	2026-05-07 19:20:00.886978+00
7	peerapol.p@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">peerapol.p@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	FAILED	ACE Mail	RECIPIENT_REJECTED	peerapol.p@airconnect-e.com: 5.1.1 <peerapol.p@airconnect-e.com>: Recipient address rejected: User unknown in virtual mailbox table	1	\N	2026-05-07 19:20:07.322808+00	2026-05-07 19:20:07.322808+00
8	peerapol.p@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">peerapol.p@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	FAILED	ACE Mail	RECIPIENT_REJECTED	peerapol.p@airconnect-e.com: 5.1.1 <peerapol.p@airconnect-e.com>: Recipient address rejected: User unknown in virtual mailbox table	1	\N	2026-05-07 19:21:15.99391+00	2026-05-07 19:21:15.99391+00
9	peerapol.p@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">peerapol.p@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	FAILED	ACE Mail	RECIPIENT_REJECTED	peerapol.p@airconnect-e.com: 5.1.1 <peerapol.p@airconnect-e.com>: Recipient address rejected: User unknown in virtual mailbox table	1	\N	2026-05-07 19:21:52.293028+00	2026-05-07 19:21:52.293028+00
10	peerapol.p@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">peerapol.p@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	FAILED	ACE Mail	RECIPIENT_REJECTED	peerapol.p@airconnect-e.com: 5.1.1 <peerapol.p@airconnect-e.com>: Recipient address rejected: User unknown in virtual mailbox table	1	\N	2026-05-07 19:21:54.696074+00	2026-05-07 19:21:54.696074+00
12	peerapol.p@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">peerapol.p@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	FAILED	ACE Mail	RECIPIENT_REJECTED	peerapol.p@airconnect-e.com: 5.1.1 <peerapol.p@airconnect-e.com>: Recipient address rejected: User unknown in virtual mailbox table	1	\N	2026-05-07 19:21:55.490002+00	2026-05-07 19:21:55.490002+00
13	Peerapol@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Peerapol@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : Peerapol@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Peerapol@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-07 19:24:31.328121+00	2026-05-07 19:24:30.916278+00	2026-05-07 19:24:30.916278+00
15	Peerapol@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Peerapol@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : Peerapol@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Peerapol@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-07 19:30:21.427021+00	2026-05-07 19:30:20.991214+00	2026-05-07 19:30:20.991214+00
16	Peerapol@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Peerapol@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : Peerapol@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Peerapol@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-07 19:44:59.266529+00	2026-05-07 19:44:58.877158+00	2026-05-07 19:44:58.877158+00
11	peerapol.p@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : peerapol.p@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">peerapol.p@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	FAILED	ACE Mail	RECIPIENT_REJECTED	peerapol.p@airconnect-e.com: 5.1.1 <peerapol.p@airconnect-e.com>: Recipient address rejected: User unknown in virtual mailbox table	1	\N	2026-05-07 19:21:55.261825+00	2026-05-07 19:21:55.261825+00
14	Ananchai@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณAnanchai Mittha,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Ananchai@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Ananchai Mittha,\nYour ACE System account is ready.\n\nUsername : Ananchai@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณAnanchai Mittha</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Ananchai@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Ananchai Mittha</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-07 19:30:12.302721+00	2026-05-07 19:30:11.863033+00	2026-05-07 19:30:11.863033+00
21	Anuwat.promt@gmail.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณAnuwat Ramring,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Anuwat.promt@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Anuwat Ramring,\nYour ACE System account is ready.\n\nUsername : Anuwat.promt@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณAnuwat Ramring</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Anuwat.promt@gmail.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Anuwat Ramring</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:31:10.480523+00	2026-05-08 06:31:10.070277+00	2026-05-08 06:31:10.070277+00
23	Tipparat@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณTipparat Buntaweelert,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Tipparat@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Tipparat Buntaweelert,\nYour ACE System account is ready.\n\nUsername : Tipparat@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณTipparat Buntaweelert</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Tipparat@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Tipparat Buntaweelert</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:34:44.561932+00	2026-05-08 06:34:44.163054+00	2026-05-08 06:34:44.163054+00
27	Ananchai@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณAnanchai Mittha,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Ananchai@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Ananchai Mittha,\nYour ACE System account is ready.\n\nUsername : Ananchai@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณAnanchai Mittha</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Ananchai@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Ananchai Mittha</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:36:23.427725+00	2026-05-08 06:36:23.001824+00	2026-05-08 06:36:23.001824+00
17	Tipparat@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณTipparat Buntaweelert,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Tipparat@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Tipparat Buntaweelert,\nYour ACE System account is ready.\n\nUsername : Tipparat@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณTipparat Buntaweelert</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Tipparat@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Tipparat Buntaweelert</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:18:40.701307+00	2026-05-08 06:18:40.290394+00	2026-05-08 06:18:40.290394+00
18	Anong@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณAnong Jantaraeng,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Anong@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Anong Jantaraeng,\nYour ACE System account is ready.\n\nUsername : Anong@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณAnong Jantaraeng</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Anong@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Anong Jantaraeng</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:21:55.002272+00	2026-05-08 06:21:54.564359+00	2026-05-08 06:21:54.564359+00
19	Narong@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณNarong Saemaphakdee,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Narong@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Narong Saemaphakdee,\nYour ACE System account is ready.\n\nUsername : Narong@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณNarong Saemaphakdee</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Narong@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Narong Saemaphakdee</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:30:28.340306+00	2026-05-08 06:30:27.911193+00	2026-05-08 06:30:27.911193+00
20	papontanai@hotmail.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPapontanai Amnouysawatchai,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : papontanai@hotmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Papontanai Amnouysawatchai,\nYour ACE System account is ready.\n\nUsername : papontanai@hotmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPapontanai Amnouysawatchai</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">papontanai@hotmail.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Papontanai Amnouysawatchai</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:30:52.645302+00	2026-05-08 06:30:52.227077+00	2026-05-08 06:30:52.227077+00
22	sakrapree@gmail.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณSakraphi Champapho,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : sakrapree@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Sakraphi Champapho,\nYour ACE System account is ready.\n\nUsername : sakrapree@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณSakraphi Champapho</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">sakrapree@gmail.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Sakraphi Champapho</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:31:30.115033+00	2026-05-08 06:31:29.711705+00	2026-05-08 06:31:29.711705+00
24	Chayaporn.s@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณChayaporn Suchaiya,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Chayaporn.s@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Chayaporn Suchaiya,\nYour ACE System account is ready.\n\nUsername : Chayaporn.s@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณChayaporn Suchaiya</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Chayaporn.s@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Chayaporn Suchaiya</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:35:25.804537+00	2026-05-08 06:35:25.384822+00	2026-05-08 06:35:25.384822+00
25	Atthapol@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณAtthapol Ruangboot,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Atthapol@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Atthapol Ruangboot,\nYour ACE System account is ready.\n\nUsername : Atthapol@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณAtthapol Ruangboot</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Atthapol@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Atthapol Ruangboot</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:35:58.603009+00	2026-05-08 06:35:58.188454+00	2026-05-08 06:35:58.188454+00
26	Chainarong@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณChainarong Songsee,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Chainarong@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Chainarong Songsee,\nYour ACE System account is ready.\n\nUsername : Chainarong@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณChainarong Songsee</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Chainarong@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Chainarong Songsee</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:36:14.312344+00	2026-05-08 06:36:13.898817+00	2026-05-08 06:36:13.898817+00
28	Kidsakond.huawei@gmail.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณKidsakon Deeprasert,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Kidsakond.huawei@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Kidsakon Deeprasert,\nYour ACE System account is ready.\n\nUsername : Kidsakond.huawei@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณKidsakon Deeprasert</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Kidsakond.huawei@gmail.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Kidsakon Deeprasert</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:36:47.684182+00	2026-05-08 06:36:47.280867+00	2026-05-08 06:36:47.280867+00
29	Rungnapa@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณRungnapa Pangkaew,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Rungnapa@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Rungnapa Pangkaew,\nYour ACE System account is ready.\n\nUsername : Rungnapa@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณRungnapa Pangkaew</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Rungnapa@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Rungnapa Pangkaew</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:46:26.953995+00	2026-05-08 06:46:26.530967+00	2026-05-08 06:46:26.530967+00
30	sakrapree@gmail.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณSakraphi Champapho,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : sakrapree@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Sakraphi Champapho,\nYour ACE System account is ready.\n\nUsername : sakrapree@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณSakraphi Champapho</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">sakrapree@gmail.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Sakraphi Champapho</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:56:43.936377+00	2026-05-08 06:56:43.501458+00	2026-05-08 06:56:43.501458+00
31	Yodsawee@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณYodsawee Khawsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Yodsawee@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Yodsawee Khawsri,\nYour ACE System account is ready.\n\nUsername : Yodsawee@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณYodsawee Khawsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Yodsawee@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Yodsawee Khawsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 06:59:17.972971+00	2026-05-08 06:59:17.538941+00	2026-05-08 06:59:17.538941+00
32	Anuwat.promt@gmail.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณAnuwat Ramring,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Anuwat.promt@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Anuwat Ramring,\nYour ACE System account is ready.\n\nUsername : Anuwat.promt@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณAnuwat Ramring</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Anuwat.promt@gmail.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Anuwat Ramring</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 07:00:43.935284+00	2026-05-08 07:00:43.484821+00	2026-05-08 07:00:43.484821+00
33	sakrapree@gmail.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณSakraphi Champapho,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : sakrapree@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Sakraphi Champapho,\nYour ACE System account is ready.\n\nUsername : sakrapree@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณSakraphi Champapho</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">sakrapree@gmail.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Sakraphi Champapho</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 07:01:14.249674+00	2026-05-08 07:01:13.759898+00	2026-05-08 07:01:13.759898+00
34	Nattapon.sa@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณNattapon Sangtienprapai,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Nattapon.sa@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Nattapon Sangtienprapai,\nYour ACE System account is ready.\n\nUsername : Nattapon.sa@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณNattapon Sangtienprapai</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Nattapon.sa@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Nattapon Sangtienprapai</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 07:02:07.694802+00	2026-05-08 07:02:07.27187+00	2026-05-08 07:02:07.27187+00
35	Nitcha.b@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณNitcha Buanak,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Nitcha.b@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Nitcha Buanak,\nYour ACE System account is ready.\n\nUsername : Nitcha.b@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณNitcha Buanak</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Nitcha.b@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Nitcha Buanak</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 07:02:23.069097+00	2026-05-08 07:02:22.672391+00	2026-05-08 07:02:22.672391+00
38	Woraphat1100@gmail.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณWoraphat Chery,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Woraphat1100@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Woraphat Chery,\nYour ACE System account is ready.\n\nUsername : Woraphat1100@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณWoraphat Chery</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Woraphat1100@gmail.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Woraphat Chery</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 07:04:32.609133+00	2026-05-08 07:04:32.14524+00	2026-05-08 07:04:32.14524+00
39	Peerapol@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPeerapol Piamsri,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Peerapol@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Peerapol Piamsri,\nYour ACE System account is ready.\n\nUsername : Peerapol@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPeerapol Piamsri</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Peerapol@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Peerapol Piamsri</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 07:24:08.865429+00	2026-05-08 07:24:08.439637+00	2026-05-08 07:24:08.439637+00
36	Phumipat@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณPhumipat Yupracham,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Phumipat@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Phumipat Yupracham,\nYour ACE System account is ready.\n\nUsername : Phumipat@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณPhumipat Yupracham</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Phumipat@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Phumipat Yupracham</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 07:02:32.473529+00	2026-05-08 07:02:32.062614+00	2026-05-08 07:02:32.062614+00
37	Narong@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณNarong Saemaphakdee,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Narong@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Narong Saemaphakdee,\nYour ACE System account is ready.\n\nUsername : Narong@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณNarong Saemaphakdee</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Narong@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Narong Saemaphakdee</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 07:03:33.745646+00	2026-05-08 07:03:33.300654+00	2026-05-08 07:03:33.300654+00
40	Boonsong.ns@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณBoonsong Nisap,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Boonsong.ns@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Boonsong Nisap,\nYour ACE System account is ready.\n\nUsername : Boonsong.ns@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณBoonsong Nisap</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Boonsong.ns@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Boonsong Nisap</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 07:44:00.38885+00	2026-05-08 07:43:59.981057+00	2026-05-08 07:43:59.981057+00
41	Wattana@airconnect-e.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณWathana Lamoon,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Wattana@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Wathana Lamoon,\nYour ACE System account is ready.\n\nUsername : Wattana@airconnect-e.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณWathana Lamoon</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Wattana@airconnect-e.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Wathana Lamoon</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-08 08:16:47.241252+00	2026-05-08 08:16:46.817711+00	2026-05-08 08:16:46.817711+00
42	Anuwat.promt@gmail.com	ACE System — ข้อมูลการเข้าสู่ระบบ / Your Login Credentials	เรียน คุณAnuwat Ramring,\nบัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว\n\nUsername : Anuwat.promt@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nกรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก\nหากมีปัญหา กรุณาติดต่อ HR\n\n---\n\nDear Anuwat Ramring,\nYour ACE System account is ready.\n\nUsername : Anuwat.promt@gmail.com\nPassword : ACE1234\nLink     : https://ace.airconnect-e.com/ClockApp\n\nPlease change your password after your first login.\nIf you have any issues, please contact HR.\n\nACE System	\n    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;line-height:1.6;color:#101828">\n      <!-- Header -->\n      <div style="background-color:#2447d8;padding:24px 28px;border-radius:10px 10px 0 0">\n        <h2 style="margin:0;color:#fff;font-size:20px;letter-spacing:.5px">ACE System</h2>\n        <p style="margin:5px 0 0;color:rgba(255,255,255,.8);font-size:13px">\n          ข้อมูลการเข้าสู่ระบบ &nbsp;·&nbsp; Login Credentials\n        </p>\n      </div>\n\n      <div style="background:#fff;padding:26px 28px;border:1px solid #e4e7ec;border-top:none;border-radius:0 0 10px 10px">\n\n        <!-- Thai greeting -->\n        <p style="margin:0 0 4px;font-size:14px">เรียน <b>คุณAnuwat Ramring</b></p>\n        <p style="margin:0 0 18px;font-size:13px;color:#475569">บัญชีผู้ใช้ ACE System ของท่านพร้อมใช้งานแล้ว</p>\n\n        <!-- Credentials table -->\n        <table style="border-collapse:collapse;width:100%;background:#f8faff;border-radius:8px;overflow:hidden;border:1px solid #e4e7ec">\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:110px;border-bottom:1px solid #e4e7ec;white-space:nowrap">Username</td>\n            <td style="padding:11px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #e4e7ec;word-break:break-all">Anuwat.promt@gmail.com</td>\n          </tr>\n          <tr>\n            <td style="padding:11px 16px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Password</td>\n            <td style="padding:11px 16px;font-weight:900;font-size:20px;letter-spacing:3px;color:#2447d8">ACE1234</td>\n          </tr>\n        </table>\n\n        <!-- Login button -->\n        <p style="margin:22px 0 6px;text-align:center">\n          <a href="https://ace.airconnect-e.com/ClockApp"\n             style="display:inline-block;background-color:#2447d8;color:#ffffff;padding:13px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;mso-padding-alt:0;border:2px solid #2447d8">\n            &#x1F511; เข้าสู่ระบบ &nbsp;/&nbsp; Sign In\n          </a>\n        </p>\n\n        <hr style="border:none;border-top:1px solid #e4e7ec;margin:22px 0">\n\n        <!-- English greeting -->\n        <p style="margin:0 0 4px;font-size:14px">Dear <b>Anuwat Ramring</b>,</p>\n        <p style="margin:0 0 14px;font-size:13px;color:#475569">Your ACE System account is now active. Use the credentials above to sign in.</p>\n\n        <!-- Notes -->\n        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7">\n          <b>⚠ หมายเหตุ / Note</b><br>\n          • กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก<br>\n          • Please change your password after your first login.<br>\n          • หากมีปัญหา กรุณาติดต่อ HR &nbsp;/&nbsp; For assistance, contact HR.\n        </div>\n\n      </div>\n\n      <!-- Footer -->\n      <p style="text-align:center;color:#94a3b8;font-size:11px;margin:14px 0 0">\n        © AirConnect Engineering Co., Ltd. &nbsp;·&nbsp; ACE System\n      </p>\n    </div>\n    	SENT	ACE Mail	\N	\N	1	2026-05-09 03:17:48.11802+00	2026-05-09 03:17:47.639551+00	2026-05-09 03:17:47.639551+00
\.


--
-- Data for Name: employee_relocations; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.employee_relocations (id, employee_code, full_name, from_project_code, from_project_name, to_project_code, to_project_name, effective_date, reason, notes, created_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.employees (id, employee_code, email, full_name, first_name, last_name, preferred_name, personal_email, phone, work_phone, department, job_title, job_level, manager_name, manager_code, cost_center, work_location, project_team, section_name, project_role, project_code, project_name, "position", status, employment_type, contract_type, hire_date, probation_end_date, termination_date, date_of_birth, gender, nationality, id_card_no, address, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, bank_name, bank_account_no, bank_account_name, photo_url, notes, source, created_at, updated_at) FROM stdin;
82	ACE174	Anong@airconnect-e.com	Anong Jantaraeng	Anong	Jantaraeng	Kook	\N	090-990-4113	\N	Accounting	Finance Officer	Accounts Payable	\N	\N	ACE	\N	Finance	Accounting and Finance	\N	Office Management	Office Management	Finance Officer	ACTIVE	FULL_TIME	FULL_TIME	2012-10-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
83	ACE246	Tip83574@gmail.com	Porntip Chotchaug	Porntip	Chotchaug	Tip	\N	085-240-7042	\N	HR	Maid	Maid	\N	\N	ACE	\N	HQ	Administrative	\N	Office Management	Office Management	Maid	ACTIVE	FULL_TIME	FULL_TIME	2013-06-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
85	ACE603	Rungnapa@airconnect-e.com	Rungnapa Pangkaew	Rungnapa	Pangkaew	Boombim	\N	081-666-3575	\N	Accounting	Accounting and Finance Manager	Accounting and Finance	\N	\N	ACE	\N	Finance	Accounting and Finance	\N	Office Management	Office Management	Accounting and Finance Manager	ACTIVE	FULL_TIME	FULL_TIME	2020-02-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
88	ACE624	Bandasak@airconnect-e.com	Bandasak Sukpheng	Bandasak	Sukpheng	Bank	BandasakSukpheng@gmail.com	084-657-2276	\N	Project	Senior Site Supervisor	Senior Site Supervisor	\N	\N	ACE	\N	PM	Project Management	\N	Project Management	Project Management	Senior Site Supervisor	ACTIVE	FULL_TIME	CONTRACT	2019-01-03	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
89	ACE630	Artit.m@airconnect-e.com	Artit Malawaichan	Artit	Malawaichan	Mean	Mean0607@gmail.com	062-706-7728	\N	Project	Senior Systems Engineer	Senior Systems Engineer	\N	\N	ACE	\N	PM	Project Management	\N	Project Management	Project Management	Senior Systems Engineer	ACTIVE	FULL_TIME	CONTRACT	2022-01-25	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
94	AE106	Tipparat@airconnect-e.com	Tipparat Buntaweelert	Tipparat	Buntaweelert	Kwangdaow	Imtipparatb@gmail.com	064-954-4192	\N	Project	RF Project Admin	Project Admin	\N	\N	AE	\N	PM	Project Management	\N	Project Management	Project Management	RF Project Admin	ACTIVE	FULL_TIME	FULL_TIME	2019-08-15	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
98	AE180	Wattana@airconnect-e.com	Wathana Lamoon	Wathana	Lamoon	Bird	\N	090-904-9173	\N	Project	Senior Project Manager	Senior Project Manager	\N	\N	AE	\N	PM	Project Management	\N	Project Management	Project Management	Senior Project Manager	ACTIVE	FULL_TIME	CONTRACT	2018-06-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
84	ACE292	Phumipat@airconnect-e.com	Phumipat Yupracham	Phumipat	Yupracham	M	\N	081-256-3327	\N	Project	Drive Test Analysis Engineer	L2	\N	\N	ACE	\N	RF	RF Project	\N	NBTC2501	NBTC NSA/SA Benchmarking Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	FULL_TIME	2013-11-10	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
86	ACE618	Sujitra@airconnect-e.com	Sujitra Khuenkhiao	Sujitra	Khuenkhiao	Paw	Paw.rmuti@gmail.com	097-953-8856	\N	Project	Report Preparation Engineer	L1	\N	\N	ACE	\N	TE	TE Project	\N	HWT2607	HWT IBS BMA&EAS Project	Report Preparation Engineer	ACTIVE	FULL_TIME	CONTRACT	2020-06-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
87	ACE623	Wachara@airconnect-e.com	Wachara Boonthai	Wachara	Boonthai	Bon	Watcharaboonthai1992@gmail.com	088-344-4504	\N	Project	Report Preparation Engineer	L1	\N	\N	ACE	\N	TE	TE Project	\N	HWT2607	HWT IBS BMA&EAS Project	Report Preparation Engineer	ACTIVE	FULL_TIME	CONTRACT	2021-06-21	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
109	ACECS286	Kankanit.suw@airconnect-e.com	Kankanit Suwannathorn	Kankanit	Suwannathorn	Dream	Kankanit.dreamm@gmail.com	098-414-7739	\N	HR	HR Coordinator	HR Coordinator	\N	\N	ACE	\N	HR	Human Resources	\N	Office Management	Office Management	HR Coordinator	ACTIVE	FULL_TIME	FULL_TIME	2024-03-06	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
110	ACE685	Keattichai.kon@airconnect-e.com	Keattichai Konggun	Keattichai	Konggun	Job	J.keattichai@gmail.com	082-691-0478	\N	HR	HR Labor Relations	HR Labor Relations	\N	\N	ACE	\N	HR	Human Resources	\N	Office Management	Office Management	HR Labor Relations	ACTIVE	FULL_TIME	FULL_TIME	2024-08-29	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
113	AE196	Thitipong.Pro@airconnect-e.com	Thitipong Promtrirat	Thitipong	Promtrirat	Fame	Thitipong.vat@gmail.com	099-364-5415	\N	Accounting	Accounting Officer	Accounting and Finance	\N	\N	AE	\N	Finance	Accounting and Finance	\N	Office Management	Office Management	Accounting Officer	ACTIVE	FULL_TIME	FULL_TIME	2024-10-15	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
116	AE201	Pimwaree.s@advance-e.net	Pimwaree Sriwun	Pimwaree	Sriwun	Pat	Pat.pimwaree@gmail.com	082-062-5796	\N	Accounting	Accounting Officer (Cambodia Support)	Accounting and Finance	\N	\N	AE	\N	Finance	Accounting and Finance	\N	Office Management	Office Management	Accounting Officer (Cambodia Support)	ACTIVE	FULL_TIME	FULL_TIME	2025-01-29	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
117	AE202	Sasivimol.p@airconnect-e.com	Sasivimon Phoraksa	Sasivimon	Phoraksa	Film	Sasivimol.po@gmail.com	093-553-5541	\N	HR	HR Recruiter	HR Recruiter	\N	\N	AE	\N	HR	Human Resources	\N	Office Management	Office Management	HR Recruiter	ACTIVE	FULL_TIME	FULL_TIME	2025-03-04	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
118	ACE692	Nitcha.b@airconnect-e.com	Nitcha Buanak	Nitcha	Buanak	Pong	Pong_kis@hotmail.com	080-905-9351	\N	Executive	Secretary	Secretary	\N	\N	ACE	\N	HQ	Head Office	\N	Office Management	Office Management	Secretary	ACTIVE	FULL_TIME	FULL_TIME	2025-04-08	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
121	ACE693	thaweephong.t@airconnect-e.com	Thaweephong Thumphung	Thaweephong	Thumphung	Mai	darkvaderskytrooper@gmail.com	095-235-5979	\N	AI	Senior Software Engineer	Senior Software Engineer	\N	\N	ACE	\N	AI	Computer Vision (AI)	\N	Computer Vision (AI)	Computer Vision (AI)	Senior Software Engineer	ACTIVE	FULL_TIME	FULL_TIME	2025-10-08	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
122	ACE694	ravit.a@airconnect-e.com	Ravit Anuvongnukroh	Ravit	Anuvongnukroh	Micky	mrravit@gmai.com	096-302-7922	\N	AI	Project Manager	Project Manager	\N	\N	ACE	\N	AI	Computer Vision (AI)	\N	Computer Vision (AI)	Computer Vision (AI)	Project Manager	ACTIVE	FULL_TIME	FULL_TIME	2025-11-03	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
123	AE204	tengteng0153@gmail.com	Suriya Chareeun	Suriya	Chareeun	Teng	\N	094-787-7127	\N	HR	Messenger	Messenger	\N	\N	AE	\N	HQ	Administrative	\N	Office Management	Office Management	Messenger	ACTIVE	FULL_TIME	FULL_TIME	2025-09-15	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
124	ACE696	thammanoon.m@airconnect-e.com	Thammanoon Malaicharoen	Thammanoon	Malaicharoen	Aek	thammanoon.mal@gmail.com	082-640-7472	\N	AI	Software Engineer	Software Engineer	\N	\N	ACE	\N	AI	Computer Vision (AI)	\N	Computer Vision (AI)	Computer Vision (AI)	Software Engineer	ACTIVE	FULL_TIME	FULL_TIME	2025-10-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
125	ACE697	poommanat.d@airconnect-e.com	Poommanat Darachalermkul	Poommanat	Darachalermkul	Monman	poommanat.d@gmail.com	097-921-1793	\N	AI	Software Engineer	Software Engineer	\N	\N	ACE	\N	AI	Computer Vision (AI)	\N	Computer Vision (AI)	Computer Vision (AI)	Software Engineer	ACTIVE	FULL_TIME	FULL_TIME	2025-10-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
76	ACE001	Bunlay.seng@airconnect-e.com	Seng Bun Lay	Seng	Bun Lay	Seng	\N	089-922-1328	\N	Executive	Managing Director	Managing Director	\N	\N	ACE	\N	HQ	Head Office	\N	Office Management	Office Management	Managing Director	ACTIVE	FULL_TIME	FULL_TIME	\N	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
77	ACE005	Phannarai@airconnect-e.com	Phannarai Phagasri	Phannarai	Phagasri	Phan	\N	090-990-4133	\N	HR	General Admin Manager	General Admin Manager	\N	\N	ACE	\N	HQ	Administrative	\N	Office Management	Office Management	General Admin Manager	ACTIVE	FULL_TIME	FULL_TIME	2007-05-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
78	ACE009	Narong@airconnect-e.com	Narong Saemaphakdee	Narong	Saemaphakdee	Narong	\N	081-912-4966	\N	Project	Project Director	Project Director	\N	\N	ACE	\N	PM	Project Management	\N	Project Management	Project Management	Project Director	ACTIVE	FULL_TIME	FULL_TIME	2007-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
79	ACE010	Atthapol@airconnect-e.com	Atthapol Ruangboot	Atthapol	Ruangboot	Bom	Atthapol.ru@gmail.com	095-995-6261	\N	Project	Senior Project Manager	Senior Project Manager	\N	\N	ACE	\N	PM	Project Management	\N	Project Management	Project Management	Senior Project Manager	ACTIVE	FULL_TIME	FULL_TIME	2008-01-15	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
128	AE205	Tugsadon@airconnect-e.com	Tugsadon Bovontanaphaisai	Tugsadon	Bovontanaphaisai	Boat	bboatum2468@gmail.com	096-872-2760	\N	HR	IT Support	IT Support	\N	\N	AE	\N	HQ	Administrative	\N	Office Management	Office Management	IT Support	ACTIVE	FULL_TIME	FULL_TIME	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
127	ACECS385	Sasikarn.b@airconnect-e.com	Sasikarn Boot-ngarm	Sasikarn	Boot-ngarm	Meiw	Sasikarn4932@gmail.com	098-107-4932	\N	Project	Safety Officer	Safety Officer	\N	\N	ACE	\N	Enterprise	Enterprise Project	\N	WW2503	WW Orange Line Project	Safety Officer	ACTIVE	FULL_TIME	CONTRACT	2025-11-11	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
80	ACE056	Peerapol@airconnect-e.com	Peerapol Piamsri	Peerapol	Piamsri	Nueng	\N	083-895-8506	\N	Project	Project Manager	Project Manager	\N	\N	ACE	\N	RF	RF Project	\N	NBTC2501	NBTC NSA/SA Benchmarking Project	Project Manager	ACTIVE	FULL_TIME	FULL_TIME	2011-06-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
81	ACE125	Ananchai@airconnect-e.com	Ananchai Mittha	Ananchai	Mittha	Bew	Ananchai.mittha@gmail.com	087-008-2326	\N	Project	Drive Test Analysis Engineer	L2	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	FULL_TIME	2012-01-10	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
126	ACECS384	Chanton225@gmail.com	Thanawut Kuwangkadilok	Thanawut	Kuwangkadilok	Ohm	\N	091-664-4336	\N	Project	Drive Test Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	NBTC2502	NBTC DRONE Thai Border Verification Project	Drive Test Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-10-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
130	ACECS388	lin.sal@airconnect-e.com	Lin Saleepan	Lin	Saleepan	Nam	lin40171@gmail.com	098-746-4117	\N	Project	Drive Test Analysis Engineer	L1.5	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
90	ACE652	Boonsong.ns@airconnect-e.com	Boonsong Nisap	Boonsong	Nisap	Au	\N	087-703-5566	\N	Project	Site Solution	Site Solution	\N	\N	ACE	\N	Enterprise	Enterprise Project	\N	WW2503	WW Orange Line Project	Site Solution	ACTIVE	FULL_TIME	FULL_TIME	2022-08-25	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
95	AE129	Peerayu@airconnect-e.com	Peerayu Chunlaphan	Peerayu	Chunlaphan	Blue	Bluepeerayu@gmail.com	094-346-3555	\N	Project	Site Engineer	Site Engineer	\N	\N	AE	\N	Enterprise	Enterprise Project	\N	WW2503	WW Orange Line Project	Site Engineer	ACTIVE	FULL_TIME	FULL_TIME	2020-05-11	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
99	AE192	Packaphon.May@airconnect-e.com	Packaphon Maythamongkolkate	Packaphon	Maythamongkolkate	Chai	Zechange@gmail.com	086-042-2444	\N	Project	Site Supervisor	Site Supervisor	\N	\N	AE	\N	Enterprise	Enterprise Project	\N	WW2503	WW Orange Line Project	Site Supervisor	ACTIVE	FULL_TIME	CONTRACT	2023-09-18	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
108	AECS298	Puksiri.kha@airconnect-e.com	Paksiri Khattiset	Paksiri	Khattiset	Ing	Puksirikh@gmail.com	089-639-9699	\N	Project	Inventory Management	Inventory Management	\N	\N	AE	\N	Enterprise	Enterprise Project	\N	WW2503	WW Orange Line Project	Inventory Management	ACTIVE	FULL_TIME	CONTRACT	2024-02-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
140	ACECS399	Pathanin2538@gmail.com	Pathanin Neampiboon	Pathanin	Neampiboon	Pop	\N	063-224-1109	\N	Project	Drive Test Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
151	ACECS415	Ponrawat1996@gmail.com	Ponlawat Sangdanjak	Ponlawat	Sangdanjak	Tum	\N	088-466-9756	\N	Project	Rf Professional L2	L2	?	?	ACE	?	RF	RF Project	\N	HWT2602	RF NPM Basic Package EAS Project	Rf Professional L2	ACTIVE	FULL_TIME	CONTRACT	2026-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
146	ACECS410	kittiphong.psauto@gmail.com	Kittiphong Wongsakul	Kittiphong	Wongsakul	Aek	\N	065-082-6499	\N	Project	Drive Test Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Engineer	ACTIVE	FULL_TIME	CONTRACT	2026-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
148	ACECS412	Fangfyhunter@gmail.com	Nattdanai Kittaponsakun	Nattdanai	Kittaponsakun	Hunter	\N	064-146-8444	\N	Project	Drive Test Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	HWT2602	RF NPM Basic Package EAS Project	Drive Test Engineer	ACTIVE	FULL_TIME	CONTRACT	2026-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
149	ACECS413	Niramol.huawei@gmail.com	Niramol Kuldilok	Niramol	Kuldilok	Not	\N	084-090-5898	\N	Project	Drive Test Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	HWT2602	RF NPM Basic Package EAS Project	Drive Test Engineer	ACTIVE	FULL_TIME	CONTRACT	2026-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
150	ACECS414	Wuttinan.wongwut@gmail.com	Wuttinan Wongwut	Wuttinan	Wongwut	Park	\N	088-690-3679	\N	Project	Rf Professional L2	L2	\N	\N	ACE	\N	RF	RF Project	\N	HWT2602	RF NPM Basic Package EAS Project	Rf Professional L2	ACTIVE	FULL_TIME	CONTRACT	2026-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
152	ACECS416	Zom.jantira04@gmail.com	Jantira Prathumwong	Jantira	Prathumwong	Zom	\N	080-352-5145	\N	Project	Rf Professional L2	L2	\N	\N	ACE	\N	RF	RF Project	\N	HWT2602	RF NPM Basic Package EAS Project	Rf Professional L2	ACTIVE	FULL_TIME	CONTRACT	2026-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
104	ACECS403	panut.png@airconnect-e.com	Panut Pang-nga	Panut	Pang-nga	Man	Panutman@hotmail.co.th	088-033-6727	\N	Project	Drive Test Analysis Engineer	L1.8	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2016-10-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
91	ACECS002	Sajja@airconnect-e.com	Sajja Kaengkan	Sajja	Kaengkan	Tang	Skangkan@gmail.com	089-646-4356	\N	Project	Project Manager	Project Manager	\N	\N	ACE	\N	RF	RF Project	\N	HWT2601	RF TRUE/HWT Flash EAS&BMA Project	Project Manager	ACTIVE	FULL_TIME	CONTRACT	2015-09-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
92	AE008	Chainarong@airconnect-e.com	Chainarong Songsee	Chainarong	Songsee	Gla	Chainarong-songsee@outlook.co.th	082-958-2152	\N	Project	Site Supervisor	Senior Site Supervisor	\N	\N	AE	\N	TE	TE Project	\N	HWT2502	TE AIS MBB Expansion BMA Project	Site Supervisor	ACTIVE	FULL_TIME	FULL_TIME	2013-04-02	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
93	AE013	Thachatham@airconnect-e.com	Thachatham Monton	Thachatham	Monton	Pe-Tong	Thachatham@outlook.com	093-134-4310	\N	Project	Drive Test Analysis Engineer	L1	\N	\N	AE	\N	RF	RF Project	\N	HWT2601	RF TRUE/HWT Flash EAS&BMA Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	FULL_TIME	2016-03-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
96	AE151	Rattana.kpk@airconnect-e.com	Rattana Kerdprakob	Rattana	Kerdprakob	J	Rattanajj1989@gmail.com	090-199-2388	\N	Project	Report Preparation Engineer	L1	\N	\N	AE	\N	TE	TE Project	\N	HWT2305	TE TRUE Merge/HWT_Rollout BMA Project	Report Preparation Engineer	ACTIVE	FULL_TIME	CONTRACT	2019-12-11	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
97	AE152	Beesomphon@gmail.com	Somphon Wongwattanagonchai	Somphon	Wongwattanagonchai	Bee	\N	080-456-7672	\N	Project	Store Officer	Store	\N	\N	AE	\N	TE	TE Project	\N	HWT2305	TE TRUE Merge/HWT_Rollout BMA Project	Store Officer	ACTIVE	FULL_TIME	CONTRACT	2019-12-11	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
100	AE194	Nattapon.sa@airconnect-e.com	Nattapon Sangtienprapai	Nattapon	Sangtienprapai	Ole	S.nattapon1989@gmail.com	088-280-9181	\N	Project	Project Manager	Project Manager	\N	\N	AE	\N	TE	TE Project	\N	HWT2305	TE TRUE Merge/HWT_Rollout BMA Project	Project Manager	ACTIVE	FULL_TIME	CONTRACT	2023-09-18	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
101	AECS212	Hs3pol@gmail.com	Thanachai Mothong	Thanachai	Mothong	Oil	\N	081-141-7166	\N	Project	Rigger	Rigger	\N	\N	AE	\N	RF	RF Project	\N	HWT2601	RF TRUE/HWT Flash EAS&BMA Project	Rigger	ACTIVE	FULL_TIME	CONTRACT	2023-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
102	AECS224	Yodsawee@airconnect-e.com	Yodsawee Khawsri	Yodsawee	Khawsri	Plug	Plugoriginal@gmail.com	091-064-2202	\N	Project	Team Leader	Team Leader/DTA-L2	\N	\N	AE	\N	RF	RF Project	\N	HWT2601	RF TRUE/HWT Flash EAS&BMA Project	Team Leader	ACTIVE	FULL_TIME	CONTRACT	2015-03-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
103	ACECS401	Kidsakond.huawei@gmail.com	Kidsakon Deeprasert	Kidsakon	Deeprasert	Champ	En13.0000@gmail.com	087-690-7598	\N	Project	Drive Test Analysis Engineer	L1.8	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2016-01-10	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
105	AECS228	Sukreephon_maichum@hotmail.com	Sukreephon Maichum	Sukreephon	Maichum	Nueng	\N	094-363-6391	\N	Project	OMC Engineer	L1	\N	\N	AE	\N	RF	RF Project	\N	HWT2601	RF TRUE/HWT Flash EAS&BMA Project	OMC Engineer	ACTIVE	FULL_TIME	CONTRACT	2017-02-15	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
106	ACECS258	Jeerasakwongphapa@gmail.com	Chirasak Wongphapa	Chirasak	Wongphapa	Not	\N	082-847-2990	\N	Project	Drive Test Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Engineer	ACTIVE	FULL_TIME	CONTRACT	2023-10-24	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
107	AECS279	Hdyuyryom@gmail.com	Akkarawut Promriew	Akkarawut	Promriew	Ton	\N	061-874-1086	\N	Project	Rigger	Rigger	\N	\N	AE	\N	TE	TE Project	\N	HWT2305	TE TRUE Merge/HWT_Rollout BMA Project	Rigger	ACTIVE	FULL_TIME	CONTRACT	2023-11-10	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
111	AECS343	metineeb.huawei@gmail.com	Metinee Boonkerd	Metinee	Boonkerd	May	Maymayy1709@gmail.com	061-076-2049	\N	Project	Drive Test Analysis Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2024-09-23	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
112	ACE690	Woraphat1100@gmail.com	Woraphat Chery	Woraphat	Chery	Sun	\N	085-379-5112	\N	Project	Drive Test Analysis? Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	HWT2601	RF TRUE/HWT Flash EAS&BMA Project	Drive Test Engineer	ACTIVE	FULL_TIME	FULL_TIME	2024-10-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
114	AECS357	Krittasin.dua@airconnect-e.com	Krittasin Duangta	Krittasin	Duangta	Dream	Krittasin.d@gmail.com	062-442-9595	\N	Project	Project Manager	Project Manager	\N	\N	AE	\N	RF	RF Project	\N	HWT2604	RF AIS/HWT Expansion EAS&BMA Project	Project Manager	ACTIVE	FULL_TIME	CONTRACT	2024-10-21	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
115	AECS359	Jatsada.me@gmail.com	Chetsada Thauaonsang	Chetsada	Thauaonsang	Mean	\N	063-771-0679	\N	Project	Drive Test Analysis Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2024-11-04	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
119	ACECS404	Prasittipon.pp@airconnect-e.com	Prasittipon Ployphum	Prasittipon	Ployphum	Got	Prasittipon1991@hotmail.com	088-564-1079	\N	Project	Drive Test Analysis Engineer	L2	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
120	ACECS406	Payonrat.jub.rf@gmail.com	Payonrat Phothiwat	Payonrat	Phothiwat	Jub	\N	095-989-1781	\N	Project	Drive Test Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-08-25	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
129	ACECS386	jukkraphon.mee@airconnect-e.com	Jukkraphon Meechai	Jukkraphon	Meechai	Mac	mr.jukkraphon@gmail.com	095-649-8147	\N	Project	Drive Test Analysis? Engineer	Team Leader (RF)	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis? Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
131	ACECS389	sulimat.son@airconnect-e.com	Sulimat Sonain	Sulimat	Sonain	Pun	sulimatsonain@gmail.com	098-712-9102	\N	Project	Drive Test Analysis Engineer	L1.5	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
132	ACECS390	phudit.chu@airconnect-e.com	Phudit Chuadnuch	Phudit	Chuadnuch	Tim	phuchuad@gmail.com	094-171-9925	\N	Project	Drive Test Analysis Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
133	ACECS392	pawaran.puy@airconnect-e.com	Pawaran Puyati	Pawaran	Puyati	Yo	pawaranpuyati@gmail.com	097-341-9903	\N	Project	Drive Test Analysis Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
134	ACECS393	chonlada.boo@airconnect-e.com	Chonlada Boonchottiphong	Chonlada	Boonchottiphong	Pang	Chonlada.boon18@gmail.com	096-167-6119	\N	Project	Drive Test Analysis Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
153	ACECS417	Sutnatie@gmail.com	Sutnatie Boonyalekha	Sutnatie	Boonyalekha	Pan	\N	083-064-9065	\N	Project	Rf Professional L3	L3	\N	\N	ACE	\N	RF	RF Project	\N	HWT2602	RF NPM Basic Package EAS Project	Rf Professional L3	ACTIVE	FULL_TIME	CONTRACT	2026-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
154	ACECS418	Suwanna.pradittara@gmail.com	Suwanna Pradittara	Suwanna	Pradittara	Mod	\N	065-414-9595	\N	Project	Rf Professional L3	L3	\N	\N	ACE	\N	RF	RF Project	\N	HWT2602	RF NPM Basic Package EAS Project	Rf Professional L3	ACTIVE	FULL_TIME	CONTRACT	2026-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
155	ACECS419	Taned79@gmail.com	Taned Yusabai	Taned	Yusabai	Tom	\N	093-2959393	\N	Project	Drive Test Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	HWT2603	RF NPM Professional Package EAS Project	Drive Test Engineer	ACTIVE	FULL_TIME	CONTRACT	2026-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
156	ACECS420	lonaraiwaew@gmail.com	Tippawan Lonarai	Tippawan	Lonarai	Waew	\N	065-515-4188	\N	Project	Rf Professional L2	L2	\N	\N	ACE	\N	RF	RF Project	\N	HWT2603	RF NPM Professional Package EAS Project	Rf Professional L2	ACTIVE	FULL_TIME	CONTRACT	2026-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
157	ACECS421	Sas_pnp@hotmail.com	Sastra Thongmak	Sastra	Thongmak	Pokpong	\N	081-632-5336	\N	Project	Rf Professional L3	L3	\N	\N	ACE	\N	RF	RF Project	\N	HWT2603	RF NPM Professional Package EAS Project	Rf Professional L3	ACTIVE	FULL_TIME	CONTRACT	2026-04-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
159	ACECS425	thanakit1986boo@gmail.com	Thanakit Bunrak	Thanakit	Bunrak	Tum	\N	064-454-6517	\N	Project	RF Professional L2	L2	\N	\N	ACE	\N	RF	RF Project	\N	HWT2603	RF NPM Professional Package EAS Project	RF Professional L2	ACTIVE	FULL_TIME	CONTRACT	2026-05-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
160	ACECS426	somchaiklinhomsophon@gmail.com	Somchai Klinhomsophon	Somchai	Klinhomsophon	Ae	\N	095-579-2627	\N	Project	RF Professional L2	L2	\N	\N	ACE	\N	RF	RF Project	\N	HWT2603	RF NPM Professional Package EAS Project	RF Professional L2	ACTIVE	FULL_TIME	CONTRACT	2026-05-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
161	ACECS427	kriangkaisit@outlook.com	Kriangkaisit Meekhun	Kriangkaisit	Meekhun	Man	\N	064-995-3244	\N	Project	RF Professional L2	L2	\N	\N	ACE	\N	RF	RF Project	\N	HWT2603	RF NPM Professional Package EAS Project	RF Professional L2	ACTIVE	FULL_TIME	CONTRACT	2026-05-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
162	ACECS428	sarany21012535@gmail.com	Saranya Tonohueng	Saranya	Tonohueng	\N	\N	061-294-6227	\N	Project	Team Leader	Team Leader	\N	\N	ACE	\N	TE	TE Project	\N	AIS2602	AIS NER Installation Service Project	Team Leader	ACTIVE	FULL_TIME	CONTRACT	2026-03-04	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
163	ACECS429	Anuwat.promt@gmail.com	Anuwat Ramring	Anuwat	Ramring	\N	\N	084-888-0648	\N	Project	Team Leader	Team Leader	\N	\N	ACE	\N	TE	TE Project	\N	AIS2602	AIS NER Installation Service Project	Team Leader	ACTIVE	FULL_TIME	CONTRACT	2026-03-04	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
164	ACECS430	sakrapree@gmail.com	Sakraphi Champapho	Sakraphi	Champapho	\N	\N	084-605-4320	\N	Project	Team Leader	Team Leader	\N	\N	ACE	\N	TE	TE Project	\N	AIS2602	AIS NER Installation Service Project	Team Leader	ACTIVE	FULL_TIME	CONTRACT	2026-03-04	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
135	ACECS394	kunwadee.hoi@airconnect-e.com	Kunwadee Hoi-mala	Kunwadee	Hoi-mala	Bam	kunwadeehoimala@gmail.com	092-412-2182	\N	Project	Drive Test Analysis Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
136	ACECS395	wuttisit.see@airconnect-e.com	Wuttisit Seewasao	Wuttisit	Seewasao	Den	wuttisit41829@gmail.com	097-359-9945	\N	Project	Drive Test Analysis Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
137	ACECS396	phonlawat.kwa@airconnect-e.com	Phonlawat Khwanthong	Phonlawat	Khwanthong	Toey	pollawat2344@gmail.com	083-521-4741	\N	Project	Drive Test Analysis Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
138	ACECS397	Macdrums78@gmail.com	Patsakorn Witenjit	Patsakorn	Witenjit	Mac	\N	099-324-8347	\N	Project	Drive Test Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
139	ACECS398	chokzee.cc@gmail.com	Chokchai Chinnarach	Chokchai	Chinnarach	M	\N	084-921-1566	\N	Project	Drive Test Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
141	ACECS400	thanaphongtri@gmail.com	Thanaphong Triphanitkun	Thanaphong	Triphanitkun	Aof	\N	093-419-6924	\N	Project	Drive Test Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Engineer	ACTIVE	FULL_TIME	CONTRACT	2025-12-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
142	ACECS407	Yuiyuiyui803@gmail.com	Panukon Sonsinpong	Panukon	Sonsinpong	Ton	\N	063-8528845	\N	Project	Drive Test Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Engineer	ACTIVE	FULL_TIME	CONTRACT	2026-01-05	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
144	ACE698	Chayaporn.s@airconnect-e.com	Chayaporn Suchaiya	Chayaporn	Suchaiya	Bee	verbtobeebie@gmail.com	093-141-2083	\N	HR	HR and Admin Manager	HR and Admin Manager	\N	\N	ACE	\N	HR	Human Resources	\N	Office Management	Office Management	HR and Admin Manager	ACTIVE	FULL_TIME	FULL_TIME	2026-02-09	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
145	ACE699	Pornpimon.chard@airconnect-e.com	Pornpimon Chardram	Pornpimon	Chardram	Jeed	Jeedprew52@gmail.com	096-758-6939	\N	HR	Purchasing Specialist	Purchasing Specialist	\N	\N	ACE	\N	HQ	Purchasing	\N	Office Management	Office Management	Purchasing Specialist	ACTIVE	FULL_TIME	FULL_TIME	2026-03-09	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
147	ACECS411	Wilairat.Khan@airconnect-e.com	Wilairat Khantikool	Wilairat	Khantikool	Megan	wilairat.khantikool@gmail.com	084-392-3788	\N	BD	Sales Manager	Sales Manager	\N	\N	ACE	\N	BD	Business Development	\N	Sales and Business Development	Sales and Business Development	Sales Manager	ACTIVE	FULL_TIME	FULL_TIME	2026-04-20	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
158	ACE700	Chotika.p@airconnect-e.com	Chotika Pimpisan	Chotika	Pimpisan	Nan	Chotikabg88@gmail.com	066-125-8868	\N	Accounting	Senior Accountant	Accounting and Finance	\N	\N	ACE	\N	Finance	Accounting and Finance	\N	Office Management	Office Management	Senior Accountant	ACTIVE	FULL_TIME	FULL_TIME	2026-05-05	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
143	ACECS408	panuwat.phiw@gmail.com	Panuwat Piwngam	Panuwat	Piwngam	Bird	\N	061-390-3596	\N	Project	Drive Test Analysis Engineer	L1	\N	\N	ACE	\N	RF	RF Project	\N	AIS2601	AIS BMA Optimization Service Project	Drive Test Analysis Engineer	ACTIVE	FULL_TIME	CONTRACT	2026-02-01	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
165	ACECS431	papontanai@hotmail.com	Papontanai Amnouysawatchai	Papontanai	Amnouysawatchai	\N	\N	088-573-4611	\N	Project	Project Coordinator and Store Officer	Project Coordinator and Store Officer	\N	\N	ACE	\N	TE	TE Project	\N	AIS2602	AIS NER Installation Service Project	Project Coordinator and Store Officer	ACTIVE	FULL_TIME	CONTRACT	2026-03-04	\N	\N	\N	\N	Thai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Employee2.xlsx	2026-05-07 19:13:48.887659+00	2026-05-08 15:57:32.776442+00
\.


--
-- Data for Name: kpi_evaluations; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.kpi_evaluations (id, eval_id, employee_name, employee_code, "position", period, item_id, main_evaluate, evaluate_item, weight, target, actual, score, remark, evaluated_by, source_updated_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: kpi_items; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.kpi_items (id, item_id, "position", main_evaluate, evaluate_item, weight, target, active, source_updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: kpi_period_items; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.kpi_period_items (id, period, employee_name, "position", item_id, weight, active, source_updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.leave_requests (id, employee_code, employee_name, leave_type, session_type, start_date, end_date, days, reason, attachment_url, status, pm_approved_by, pm_approved_at, spm_approved_by, spm_approved_at, dc_approved_by, dc_approved_at, hr_acknowledged_by, hr_acknowledged_at, reject_at_step, reject_reason, reviewed_by, reviewed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: project_assignments_live; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.project_assignments_live (id, project_code, employee_code, role_in_project, job_level, start_date, end_date, allocation_pct, is_active, notes, created_at, updated_at, clock_type) FROM stdin;
1	AIS2601	ACE-XLSX-001	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
2	AIS2601	ACE-XLSX-002	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
3	NBTC2501	ACE-XLSX-003	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
4	AIS2601	ACE-XLSX-004	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
5	AIS2601	ACE-XLSX-005	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
6	HWT2304	ACE-XLSX-006	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
7	HWT2304	ACE-XLSX-007	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
8	HWT2301	ACE-XLSX-008	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
9	ZTE2301	ACE-XLSX-009	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
10	HWT2501	ACE-XLSX-010	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
11	HWT2301	ACE-XLSX-011	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
16	AIS2601	ACE-XLSX-016	REPORT_PREP	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
17	AIS2601	ACE-XLSX-017	REPORT_PREP	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
22	HWT2304	ACE-XLSX-022	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
23	HWT2501	ACE-XLSX-023	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
24	HWT2501	ACE-XLSX-024	REPORT_PREP	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
25	NBTC2501	ACE-XLSX-025	REPORT_PREP	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
26	Project	ACE-XLSX-026	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
27	Project	ACE-XLSX-027	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
28	WW2503	ACE-XLSX-028	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
29	HWT2502	ACE-XLSX-029	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
30	WW2503	ACE-XLSX-030	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
31	Project	ACE-XLSX-031	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
32	Project	ACE-XLSX-032	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
33	WW2503	ACE-XLSX-033	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
34	HWT2305	ACE-XLSX-034	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
35	HWT2305	ACE-XLSX-035	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
36	WW2503	ACE-XLSX-036	OTHER	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
37	HWT2305	ACE-XLSX-037	REPORT_PREP	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
38	HWT2305	ACE-XLSX-038	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
39	WW2503	ACE-XLSX-039	OTHER	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
40	HWT2501	ACE-XLSX-040	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
41	HWT2501	ACE-XLSX-041	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
42	HWT2306	ACE-XLSX-042	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
43	HWT2501	ACE-XLSX-043	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
44	HWT2307	ACE-XLSX-044	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
45	HWT2301	ACE-XLSX-045	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
46	AIS2601	ACE-XLSX-046	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
47	HWT2301	ACE-XLSX-047	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
48	HWT2307	ACE-XLSX-048	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
49	AIS2601	ACE-XLSX-049	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
50	AIS2601	ACE-XLSX-050	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
51	AIS2601	ACE-XLSX-051	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
52	ZTE2301	ACE-XLSX-052	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
53	HWT2301	ACE-XLSX-053	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
54	HWT2304	ACE-XLSX-054	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
55	HWT2304	ACE-XLSX-055	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
56	HWT2304	ACE-XLSX-056	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
57	HWT2306	ACE-XLSX-057	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
58	HWT2306	ACE-XLSX-058	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
59	HWT2301	ACE-XLSX-059	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
60	AIS2601	ACE-XLSX-060	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
61	HWT2301	ACE-XLSX-061	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
62	HWT2301	ACE-XLSX-062	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
63	HWT2501	ACE-XLSX-063	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
64	HWT2501	ACE-XLSX-064	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
65	AIS2601	ACE-XLSX-065	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
66	NBTC2501	ACE-XLSX-066	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
67	AIS2601	ACE-XLSX-067	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
68	NBTC2502	ACE-XLSX-068	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
69	AIS2601	ACE-XLSX-069	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
70	AIS2601	ACE-XLSX-070	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
71	AIS2601	ACE-XLSX-071	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
72	AIS2601	ACE-XLSX-072	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
73	AIS2601	ACE-XLSX-073	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
74	AIS2601	ACE-XLSX-074	DTA	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
75	AIS2601	ACE-XLSX-075	DTE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
12	Project	ACE-XLSX-012	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
13	NBTC2501	ACE-XLSX-013	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
14	HWT2306	ACE-XLSX-014	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
15	HWT2501	ACE-XLSX-015	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
18	Project	ACE-XLSX-018	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
19	AIS2601	ACE-XLSX-019	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
20	HWT2306	ACE-XLSX-020	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
21	AIS2601	ACE-XLSX-021	TE	\N	\N	\N	100	t	\N	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	DAILY
\.


--
-- Data for Name: project_catalog; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.project_catalog (id, project_code, project_name, team, headcount, notes, created_at) FROM stdin;
1	AIS2601	AIS2601 : AIS BMA Optimization Service Project	RF	22	\N	2026-05-07 10:42:28.427532+00
2	NBTC2501	NBTC2501 : NBTC NSA/SA Benchmarking Project	RF	4	\N	2026-05-07 10:42:28.427532+00
3	HWT2304	HWT2304 : RF TRUE Merge/HWT_Rollout EAS Project	RF	6	\N	2026-05-07 10:42:28.427532+00
4	HWT2301	HWT2301 : RF AIS/HWT NT700 EEC project	RF	8	\N	2026-05-07 10:42:28.427532+00
5	ZTE2301	ZTE2301 : RF TRUE Merge/ZTE_Rollout South Project	RF	2	\N	2026-05-07 10:42:28.427532+00
6	HWT2501	HWT2501 : RF New NPM TRUE Merge support complain EAS Project	RF	9	\N	2026-05-07 10:42:28.427532+00
7	Project	Project Management	RF	6	\N	2026-05-07 10:42:28.427532+00
8	HWT2306	HWT2306 : RF NPM Package TRUE Merge EAS Project	RF	5	\N	2026-05-07 10:42:28.427532+00
9	WW2503	WW2503 : WW Orange Line Project	Other	5	\N	2026-05-07 10:42:28.427532+00
10	HWT2502	HWT2502 : TE AIS MBB Expansion BMA Project	TE	1	\N	2026-05-07 10:42:28.427532+00
11	HWT2305	HWT2305 : TE TRUE Merge/HWT_Rollout BMA Project	TE	4	\N	2026-05-07 10:42:28.427532+00
12	HWT2307	HWT2307 : RF NPM Package AIS NT700 EEC Project	RF	2	\N	2026-05-07 10:42:28.427532+00
13	NBTC2502	NBTC2502 : NBTC DRONE Thai Border Verification Project	RF	1	\N	2026-05-07 10:42:28.427532+00
16	HWT2604	HWT2604 : RF TRUE/HWT Flash EAS&BMA Project	RF	0	\N	2026-05-10 17:39:57.857122+00
\.


--
-- Data for Name: project_pos; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.project_pos (id, po_target, project_code, po_number, po_line, du_id, item_dis, cluster_site, owner, lat_long, on_air, cluster_type, created_at, updated_at, work_type, site_code, workflow_status, mapping_confidence, mapping_rule, need_mapping_review, current_owner_role, current_owner_user, hold_reason, expected_release_date, finance_checked_at, sent_to_project_at, project_accepted_at, approved_at, revision, locked, last_action_at, source) FROM stdin;
1	RF	AIS2601	PO-RF-2026-001	001	DU-BKK-0421	Drive Test Service	BKK-Cluster-A / SITE-AIS-BKK-0421	Peerapol Piamsri	13.7433, 100.5588	2026-05-01	RF / Urban	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	\N	\N	PENDING_SITE_MAP	100	Existing project code	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-07 10:42:28.459166+00	\N
2	RF	AIS2601	PO-RF-2026-001	002	DU-BKK-0422	Report Preparation	BKK-Cluster-A / SITE-AIS-BKK-0422	Kannika Phanit	13.7456, 100.5602	2026-05-03	RF / Urban	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00	\N	\N	PENDING_SITE_MAP	100	Existing project code	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-07 10:42:28.459166+00	\N
12	RF	HWT2304	1051HG2997963-331	180174200208048129801	CBI1029	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_2 sectors	EAS0055-SSOA-1	\N	\N	2025-12-21	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
13	RF	HWT2304	1051HG2997963-333	180253029178912771201	CBRA506	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_2 sectors	EAS0055-SSOA-1	\N	\N	2025-12-26	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
14	RF	HWT2304	1051HG2997963-333	180253029178912774801	CBRA504	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_2 sectors	EAS0055-SSOA-1	\N	\N	2025-12-30	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
15	RF	HWT2604	1051HG2696155-117	180406969396948175601	PDAGM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
16	RF	HWT2604	1051HG2696155-117	180406969396948177401	RRPTM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
17	RF	HWT2604	1051HG2696155-117	180406969396948179201	SCTEM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
18	RF	HWT2604	1051HG2696155-117	180406969396948181001	SOKDM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
19	RF	HWT2604	1051HG2696155-117	180406969396948182801	SPGTM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
20	RF	HWT2604	1051HG2696155-117	180406969396948184601	TBYJM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
21	RF	HWT2604	1051HG2696155-117	180406969396948186401	PGRDM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
22	RF	HWT2604	1051HG2696155-117	180406969396948188201	SJIEM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
23	RF	HWT2604	1051HG2696155-117	180406969396948190001	TTKHM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
24	RF	HWT2604	1051HG2696155-117	180406969396948191801	STPEM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
25	RF	HWT2604	1051HG2696155-117	180406969396948193601	NNTDM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
26	RF	HWT2604	1051HG2696155-117	180406969396948195401	AMEKM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
27	RF	HWT2604	1051HG2696155-117	180406969396948197201	NNWGM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
28	RF	HWT2604	1051HG2696155-117	180406969396948199001	WTTDM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
29	RF	HWT2604	1051HG2696155-117	180406969396948200801	AMTAM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
30	RF	HWT2604	1051HG2696155-117	180406969396948202601	BGNRM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
31	RF	HWT2604	1051HG2696155-117	180406969396948204401	NKOKM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
32	RF	HWT2604	1051HG2696155-117	180406969396948206201	PMCDM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
33	RF	HWT2604	1051HG2696155-117	180406969396948208001	CKNOM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
34	RF	HWT2604	1051HG2696155-117	180406969396948209801	TTKHM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
35	RF	HWT2604	1051HG2696155-117	180406969396948211601	CRBKM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
36	RF	HWT2604	1051HG2696155-117	180406969396948213401	MKHRM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
37	RF	HWT2604	1051HG2696155-117	180406969396948215201	NGETM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
38	RF	HWT2604	1051HG2696155-117	180406969396948217001	PSLLM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
39	RF	HWT2604	1051HG2696155-117	180406969396948218801	SJDHM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
40	RF	HWT2604	1051HG2696155-117	180406969396948220601	BGNRM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
41	RF	HWT2604	1051HG2696155-117	180406969396948222401	BSNTM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
42	RF	HWT2604	1051HG2696155-117	180406969396948224201	BWMTM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
43	RF	HWT2604	1051HG2696155-117	180406969396948226001	CLMLM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
44	RF	HWT2604	1051HG2696155-117	180406969396948227801	KAOSM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
45	RF	HWT2604	1051HG2696155-117	180406969396948229601	MWGWM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
46	RF	HWT2604	1051HG2696155-117	180406969396948231401	TWSPM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
47	RF	HWT2604	1051HG2696155-117	180406969396948233201	NPUKM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
48	RF	HWT2604	1051HG2696155-117	180406969396948235001	EWTSM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
49	RF	HWT2604	1051HG2696155-117	180406969396948236801	NCCOM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
50	RF	HWT2604	1051HG2696155-117	180406969396948238601	NGETM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
51	RF	HWT2604	1051HG2696155-117	180406969396948240401	PDENM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
52	RF	HWT2604	1051HG2696155-117	180406969396948242201	NBRPM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
53	RF	HWT2604	1051HG2696155-117	180406969396948244001	BUTHM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
54	RF	HWT2604	1051HG2696155-117	180406969396948245801	WKCMM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
55	RF	HWT2604	1051HG2696155-117	180406969396948247601	BMYIM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
56	RF	HWT2604	1051HG2696155-117	180406969396948249401	BUTHM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
57	RF	HWT2604	1051HG2696155-117	180406969396948251201	VNVPM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
58	RF	HWT2604	1051HG2696155-117	180406969396948253001	SJDHM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
59	RF	HWT2604	1051HG2696155-117	180406969396948254801	TWSPM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
60	RF	HWT2604	1051HG2696155-117	180406969396948256601	CBNGM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
61	RF	HWT2604	1051HG2696155-117	180406969396948258401	LTTWM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
62	RF	HWT2604	1051HG2696155-117	180406969396948260201	TPPAM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
63	RF	HWT2604	1051HG2696155-117	180406969396948262001	WKHLM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
64	RF	HWT2604	1051HG2696155-117	180406969396948263801	WKCMM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
65	RF	HWT2604	1051HG2696155-117	180406969396948265601	CSNTM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
66	RF	HWT2604	1051HG2696155-117	180406969396948267401	ELLRM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
67	RF	HWT2604	1051HG2696155-117	180406969396948269201	CNGHM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
68	RF	HWT2604	1051HG2696155-117	180406969396948271001	HYACM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
69	RF	HWT2604	1051HG2696155-117	180406969396948272801	KAUDM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
70	RF	HWT2604	1051HG2696155-117	180406969396948274601	PPMWM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
71	RF	HWT2604	1051HG2696155-117	180406969396948276401	NKMJM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
72	RF	HWT2604	1051HG2696155-117	180406969396948278201	TFDBM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
73	RF	HWT2604	1051HG2696155-117	180406969396948280001	KPIHM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
74	RF	HWT2604	1051HG2696155-117	180406969396948281801	PTYTM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
75	RF	HWT2604	1051HG2696155-117	180406969396948283601	WSNOM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
76	RF	HWT2604	1051HG2696155-117	180406969396948285401	KSCBM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
77	RF	HWT2604	1051HG2696155-117	180406969396948287201	MHBNM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
78	RF	HWT2604	1051HG2696155-117	180406969396948289001	MTWBM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
79	RF	HWT2604	1051HG2696155-117	180406969396948290801	MWBKM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
80	RF	HWT2604	1051HG2696155-117	180406969396948292601	MWCSM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
81	RF	HWT2604	1051HG2696155-117	180406969396948294401	NPDNM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
82	RF	HWT2604	1051HG2696155-117	180406969396948296201	WTBRM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
83	RF	HWT2604	1051HG2696155-117	180406969396948298001	RYGHM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
84	RF	HWT2604	1051HG2696155-117	180406969396948299801	NANJM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
85	RF	HWT2604	1051HG2696155-117	180406969396948301601	PEABM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
86	RF	HWT2604	1051HG2696155-117	180406969396948303401	CKNUM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
87	RF	HWT2604	1051HG2696155-117	180406969396948305201	LMYRM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
88	RF	HWT2604	1051HG2696155-117	180406969396948307001	NKGDM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
89	RF	HWT2604	1051HG2696155-117	180406969396948308801	PLGYM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
90	RF	HWT2604	1051HG2696155-117	180406969396948310601	SBKHM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
91	RF	HWT2604	1051HG2696155-117	180406969396948312401	TPDUM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
92	RF	HWT2604	1051HG2696155-117	180406969396948314201	CKHMM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
93	RF	HWT2604	1051HG2696155-117	180406969396948316001	KTHNM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
94	RF	HWT2604	1051HG2696155-117	180406969396948317801	NKALM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
95	RF	HWT2604	1051HG2696155-117	180406969396948319601	NKGDM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
96	RF	HWT2604	1051HG2696155-117	180406969396948321401	PLGYM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
97	RF	HWT2604	1051HG2696155-117	180406969396948323201	TKHIM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
98	RF	HWT2604	1051HG2696155-117	180406969396948325001	DPJSM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
99	RF	HWT2604	1051HG2696155-117	180406969396948326801	KAKHM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
100	RF	HWT2604	1051HG2696155-117	180406969396948328601	WLGWM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
101	RF	HWT2604	1051HG2696155-117	180406969396948330401	NAAHM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
102	RF	HWT2604	1051HG2696155-117	180406969396948332201	MJSHM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
103	RF	HWT2604	1051HG2696155-117	180406969396948334001	NIPTM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
104	RF	HWT2604	1051HG2696155-117	180406969396948335801	WLGWM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
105	RF	HWT2604	1051HG2696155-117	180406969396948337601	WPMSM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
106	RF	HWT2604	1051HG2696155-117	180406969396948339401	YSPUM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
107	RF	HWT2604	1051HG2696155-117	180406969396948341201	SLDTP	A_Cluster RF Optimization for 1 layer (easy) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
108	RF	HWT2604	1051HG2696155-117	180406969396948343001	YTBKM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
109	RF	HWT2604	1051HG2696155-117	180406969396948344801	PYCAM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
110	RF	HWT2604	1051HG2696155-117	180406969396948346601	MNMPM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
111	RF	HWT2604	1051HG2696155-117	180406969396948348401	SYSBM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
112	RF	HWT2604	1051HG2696155-117	180406969396948350201	PNCAM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
113	RF	HWT2604	1051HG2696155-117	180406969396948352001	WHCNM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
114	RF	HWT2604	1051HG2696155-117	180406969396948353801	SPTYM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
115	RF	HWT2604	1051HG2696155-117	180406969396948355601	WHBCM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
116	RF	HWT2604	1051HG2696155-117	180406969396948357401	RSTDM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
117	RF	HWT2604	1051HG2696155-117	180406969396948359201	MNKUM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
118	RF	HWT2304	1051HG2997963-336	180615173949877453801	CBRA517	B_Single Site Verification for 10 or more than 10 layers_2 sectors_2 Operators with partial DT	EAS0047-SSOA-2	\N	13.044961,101.102031	2025-12-15	10 or more than 10 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
119	RF	HWT2304	1051HG2997963-336	180615173949877454801	CBRA518	B_Single Site Verification for 10 or more than 10 layers_2 Operators with partial DT	EAS0047-SSOA-2	\N	13.021771,101.091951	2025-12-15	10 or more than 10 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
120	RF	HWT2304	1051HG2997963-337	180766756230879646201	SKE0217	B_Single Site Verification for Small Cell for 4-5 layers (BBU)_1 sector_2 Operators with partial DT	EAS0214-SSOA-3	\N	\N	2026-02-20	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
121	RF	HWT2304	1051HG2997963-337	180766756230879647201	SKE0157	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 sectors_2 Operators with partial DT	EAS0214-SSOA-3	\N	\N	2026-02-16	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
122	RF	HWT2304	1051HG2997963-338	181224628092121088801	MEDIU	B_Medium NPM drive test, analysis and optimization services (region/month)	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
123	RF	HWT2304	1051HG2997963-339	181282690896076801401	CBRA516	B_SSOA DT Optimization for 8~9 layers	EAS0047-SSOA-2	\N	\N	2025-12-29	8~9 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
124	RF	HWT2304	1051HG2997963-339	181282690896076803201	NKN7232	B_SSOA DT Optimization for 4~5 layers	EAS0202-SSOA-1	\N	\N	2026-01-14	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
125	RF	HWT2304	1051HG2997963-339	181282690896076805001	CBRA469	B_SSOA DT Optimization for 8~9 layers	EAS0046-SSOA-1	\N	\N	2026-01-12	8~9 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
126	RF	HWT2304	1051HG2997963-339	181282690896076806801	CBR0268	B_SSOA DT Optimization for 1~3 layers_2 sectors	EAS0222-SSOA-1	\N	\N	2025-12-29	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
127	RF	HWT2304	1051HG2997963-344	181793842685651354401	CBRA470	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	EAS0150-SSOA-1	\N	13.375321,101.184161	2026-03-25	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
128	RF	HWT2304	1051HG2997963-345	181958127761967514601	CBRA432	B_SSOA DT Optimization for 6~7 layers	EAS0041-SSOA-1	\N	\N	\N	6~7 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
129	RF	HWT2304	1051HG2997963-345	181958127761967516401	RYG0699	B_SSOA DT Optimization for 1~3 layers	EAS0089-SSOA-2	\N	\N	2026-01-26	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
130	RF	HWT2604	1051HG2696155-119	182398578376781826201	CHMWM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
131	RF	HWT2604	1051HG2696155-119	182398578376781828001	TBKDM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
132	RF	HWT2604	1051HG2696155-119	182398578376781829801	WTSYM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
133	RF	HWT2604	1051HG2696155-119	182398578376781831601	ABPKM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
134	RF	HWT2604	1051HG2696155-119	182398578376781833401	BBGSM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
135	RF	HWT2604	1051HG2696155-119	182398578376781835201	NKPIM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
136	RF	HWT2604	1051HG2696155-119	182398578376781837001	TDHRM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
137	RF	HWT2604	1051HG2696155-119	182398578376781838801	TLRPM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
138	RF	HWT2604	1051HG2696155-119	182398578376781840601	WTSYM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
139	RF	HWT2604	1051HG2696155-119	182398578376781842401	KWGMM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
140	RF	HWT2604	1051HG2696155-119	182398578376781846001	MNNKM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
141	RF	HWT2604	1051HG2696155-119	182398578376781847801	NCHKM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
142	RF	HWT2604	1051HG2696155-119	182398578376781849601	ALPRM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
143	RF	HWT2604	1051HG2696155-119	182398578376781851401	SNJHM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
144	RF	HWT2604	1051HG2696155-119	182398578376781853201	WPNRM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
145	RF	HWT2604	1051HG2696155-119	182398578376781855001	MKLAM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
146	RF	HWT2604	1051HG2696155-119	182398578376781856801	KTLDM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
147	RF	HWT2604	1051HG2696155-119	182398578376781858601	RBNTM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
148	RF	HWT2604	1051HG2696155-119	182398578376781860401	FSNPM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
149	RF	HWT2604	1051HG2696155-119	182398578376781862201	KRAOM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
150	RF	HWT2604	1051HG2696155-119	182398578376781864001	MABTM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
151	RF	HWT2604	1051HG2696155-119	182398578376781865801	PRMSM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
152	RF	HWT2604	1051HG2696155-119	182398578376781867601	THTTM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
153	RF	HWT2604	1051HG2696155-119	182398578376781869401	TTIKM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
154	RF	HWT2604	1051HG2696155-119	182398578376781871201	MABTM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
155	RF	HWT2604	1051HG2696155-119	182398578376781873001	NSTEM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
156	RF	HWT2604	1051HG2696155-119	182398578376781876601	WHCNM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
157	RF	HWT2604	1051HG2696155-119	182398578376781878401	BAMGM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
158	RF	HWT2604	1051HG2696155-119	182398578376781880201	HMRCM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
159	RF	HWT2604	1051HG2696155-119	182398578376781882001	BGKPM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
160	RF	HWT2604	1051HG2696155-119	182398578376781883801	BLYOM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
161	RF	HWT2604	1051HG2696155-119	182398578376781885601	WHCNM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
162	RF	HWT2604	1051HG2696155-119	182398578376781887401	WHCMM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
163	RF	HWT2604	1051HG2696155-119	182398578376781889201	WHCEM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
164	RF	HWT2604	1051HG2696155-119	182398578376781891001	WHCMM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
165	RF	HWT2604	1051HG2696155-119	182398578376781892801	WHCEM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
166	RF	HWT2604	1051HG2696155-119	182398578376781896401	AGWNM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
167	RF	HWT2604	1051HG2696155-119	182398578376781898201	BBGSM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
168	RF	HWT2604	1051HG2696155-119	182398578376781900001	TTBBM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
169	RF	HWT2604	1051HG2696155-120	182398872152542413801	CPCEM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
170	RF	HWT2604	1051HG2696155-120	182398872152542415601	RDDKM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
171	RF	HWT2304	1051HG2997963-347	182419692436035175801	PCR4002	B_Single Site Verification for 10 or more than 10 layers_2 Operators with partial DT	EAS0206-SSOA-1	\N	14.010478,101.704917	\N	10 or more than 10 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
172	RF	HWT2304	1051HG2997963-347	182419692436035178801	SKO6710	B_Single Site Verification for 8~9 layers_2 Operators with partial DT	EAS0183-Full-1	\N	13.846301,102.387601	\N	8~9 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
173	RF	HWT2304	1051HG2997963-348	182477547363581953801	SKO7295	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0217-Border-1	\N	13.803223,102.705323	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
174	RF	HWT2304	1051HG2997963-348	182477547363581954801	SKO7605	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0213-Border-1	\N	13.583121,102.412831	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
175	RF	HWT2304	1051HG2997963-348	182477547363581955801	SKO7613	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0213-Border-2	\N	13.603601,102.436501	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
176	RF	HWT2304	1051HG2997963-348	182477547363581956801	SKO7614	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0184-Border-1	\N	13.598152,102.363182	2026-03-10	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
177	RF	HWT2304	1051HG2997963-348	182477547363581957801	SKO7616	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0219-Border-1	\N	14.040039,102.858942	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
178	RF	HWT2304	1051HG2997963-348	182477547363581958801	CBR7231	B_Single Site Verification for 1~3 layers_2 Operators with partial DT	EAS0222-SSOA-2	\N	13.132035,100.811703	2026-02-18	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
179	RF	HWT2304	1051HG2997963-349	182708670721040384601	CBRA526	B_Pre DT and report for insufficient sample scenario	EAS0038-SSOA-2	\N	\N	2026-04-20	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
180	RF	HWT2304	1051HG2997963-349	182708670721040385601	CBRA527	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
181	RF	HWT2304	1051HG2997963-349	182708670721040386601	CBRA529	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
182	RF	HWT2304	1051HG2997963-349	182708670721040387601	PCR7273	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
183	RF	HWT2304	1051HG2997963-349	182708670721040388601	RYG6435	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
184	RF	HWT2304	1051HG2997963-349	182708670721040389601	CCS7919	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
185	RF	HWT2304	1051HG2997963-349	182708670721040390601	SKO7286	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
186	RF	HWT2304	1051HG2997963-349	182708670721040391601	CCS7913	B_Pre DT and report for insufficient sample scenario_2 sectors	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
187	RF	HWT2304	1051HG2997963-349	182708670721040392601	TRT7156	B_Pre DT and report for insufficient sample scenario for Small cell (BBU)_2 sectors	\N	\N	\N	2026-01-30	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
188	RF	HWT2304	1051HG2997963-349	182708670721040393601	CBRA414	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
189	RF	HWT2304	1051HG2997963-349	182708670721040394601	CTI0007	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
190	RF	HWT2304	1051HG2997963-349	182708670721040395601	SKO7279	B_Pre DT and report for insufficient sample scenario	EAS0185-SSOA-2	\N	\N	2026-04-24	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
191	RF	HWT2304	1051HG2997963-349	182708670721040396601	CBR7316	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
192	RF	HWT2304	1051HG2997963-349	182708670721040397601	CBRA470	B_Pre DT and report for insufficient sample scenario	EAS0150-SSOA-1	\N	\N	2026-03-25	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
193	RF	HWT2304	1051HG2997963-349	182708670721040398601	RYG7343	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
194	RF	HWT2304	1051HG2997963-349	182708670721040399601	RYG7344	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
195	RF	HWT2304	1051HG2997963-349	182708670721040400601	RYG7345	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
196	RF	HWT2304	1051HG2997963-349	182708670721040401601	RYG7346	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
197	RF	HWT2304	1051HG2997963-349	182708670721040402601	CBR6449	B_Pre DT and report for insufficient sample scenario for Small cell (BBU)_2 sectors	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
198	RF	HWT2304	1051HG2997963-349	182708670721040403601	CCS7685	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
199	RF	HWT2304	1051HG2997963-349	182708670721040404601	RYG7339	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
200	RF	HWT2304	1051HG2997963-349	182708670721040405601	RYG6427	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
201	RF	HWT2304	1051HG2997963-349	182708670721040406601	RYG6426	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
202	RF	HWT2304	1051HG2997963-349	182708670721040407601	RYG6428	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
203	RF	HWT2304	1051HG2997963-349	182708670721040408601	CCS7918	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
204	RF	HWT2304	1051HG2997963-349	182708670721040409601	CCS7920	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
205	RF	HWT2304	1051HG2997963-349	182708670721040410601	CBRA520	B_Pre DT and report for insufficient sample scenario	EAS0066-SSOA-1	\N	\N	2026-04-21	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
206	RF	HWT2304	1051HG2997963-349	182708670721040411601	PCR7272	B_Pre DT and report for insufficient sample scenario for Small cell (BBU)_2 sectors	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
207	RF	HWT2304	1051HG2997963-349	182708670721040412601	CBRA523	B_Pre DT and report for insufficient sample scenario	EAS0029-SSOA-1	\N	\N	2026-03-16	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
208	RF	HWT2304	1051HG2997963-349	182708670721040413601	RYG6434	B_Pre DT and report for insufficient sample scenario	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
209	RF	HWT2304	1051HG2997963-350	182847819071689524201	SKO7604	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0213-Border-1	\N	13.577119,102.423301	2026-03-18	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
210	RF	HWT2304	1051HG2997963-350	182847819071689525201	SKO7606	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0213-Border-1	\N	13.576291,102.400451	2026-03-10	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
211	RF	HWT2304	1051HG2997963-350	182847819071689526201	SKO7607	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0213-Border-1	\N	13.589261,102.384327	2026-03-10	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
212	RF	HWT2304	1051HG2997963-350	182847819071689527201	SKO7609	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0213-Border-2	\N	13.600571,102.470311	2026-03-10	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
213	RF	HWT2304	1051HG2997963-350	182847819071689528201	SKO7610	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0213-Border-3	\N	13.613301,102.474801	2026-03-20	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
214	RF	HWT2304	1051HG2997963-350	182847819071689529201	SKO7611	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0213-Border-2	\N	13.597566,102.444601	2026-03-10	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
215	RF	HWT2304	1051HG2997963-350	182847819071689530201	SKO7615	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 sectors_2 Operators with partial DT	EAS0184-Border-1	\N	13.592601,102.376501	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
216	RF	HWT2304	1051HG2997963-351	182928324797790618401	SKO7612	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0213-Border-2	\N	13.598201,102.455701	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
217	RF	HWT2304	1051HG2997963-352	183348334804196557401	SKO7292	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0218-Border-1	\N	13.932011,102.757339	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
218	RF	HWT2304	1051HG2997963-352	183348334804196558401	SKO7293	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0218-Border-1	\N	13.927405,102.753168	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
219	RF	HWT2304	1051HG2997963-352	183348334804196559401	SKO7618	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0184-Border-1	\N	13.451901,102.317501	2026-03-20	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
220	RF	HWT2604	1051HG2696155-121	183392050699406541801	-100000502308003	A_Medium NPM drive test, analysis and optimization services (region/month)	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
221	RF	HWT2604	1051HG2696155-121	183392050699406542801	-100000502308003	A_NPM OSS and OMC Services (region/month)	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
222	RF	HWT2304	1051HG2997963-353	183449941704678605601	SKO7294	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0218-Border-1	\N	13.889631,102.748136	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
223	RF	HWT2304	1051HG2997963-354	183740953227160781401	CTB6712	B_Single Site Verification for 8~9 layers_2 Operators with partial DT	EAS0189-SSOA-2	\N	12.937088,102.058418	\N	8~9 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
224	RF	HWT2304	1051HG2997963-355	183740954086150144801	CBR7231	B_SSOA DT Optimization for 1~3 layers	EAS0222-SSOA-2	\N	\N	2026-02-18	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
225	RF	HWT2604	1051HG2696155-122	183817764422382387801	NHKNM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
226	RF	HWT2604	1051HG2696155-122	183817764422382389601	NYDTM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
227	RF	HWT2604	1051HG2696155-122	183817764422382391401	RRSCM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
228	RF	HWT2604	1051HG2696155-122	183817764422382396801	CBNRM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
229	RF	HWT2604	1051HG2696155-122	183817764422382398601	SKDGM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
230	RF	HWT2604	1051HG2696155-122	183817764422382400401	SRIGM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
231	RF	HWT2604	1051HG2696155-122	183817764422382402201	WKTTM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
232	RF	HWT2604	1051HG2696155-122	183817764422382404001	CWKWM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
233	RF	HWT2604	1051HG2696155-122	183817764422382405801	IZKGM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
234	RF	HWT2604	1051HG2696155-122	183817764422382407601	WWYNM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
235	RF	HWT2604	1051HG2696155-122	183817764422382409401	WAMAM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
236	RF	HWT2604	1051HG2696155-122	183817764422382411201	BBPYM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
237	RF	HWT2604	1051HG2696155-122	183817764422382413001	NKNMM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
238	RF	HWT2604	1051HG2696155-122	183817764422382414801	NSCHM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
239	RF	HWT2604	1051HG2696155-122	183817764422382416601	KKIWM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
240	RF	HWT2604	1051HG2696155-122	183817764422382418401	WHCWM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
241	RF	HWT2604	1051HG2696155-122	183817764422382420201	SGKGM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
242	RF	HWT2604	1051HG2696155-122	183817764422382422001	SGKSM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
243	RF	HWT2604	1051HG2696155-122	183817764422382423801	WLPMM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
244	RF	HWT2604	1051HG2696155-122	183817764422382425601	YSUEM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
245	RF	HWT2604	1051HG2696155-122	183817764422382427401	BMMKM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
246	RF	HWT2604	1051HG2696155-122	183817764422382429201	MBGPM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
247	RF	HWT2604	1051HG2696155-122	183817764422382431001	MPNGM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
248	RF	HWT2604	1051HG2696155-122	183817764422382432801	PSKMM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
249	RF	HWT2604	1051HG2696155-122	183817764422382434601	WTNLM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
250	RF	HWT2604	1051HG2696155-122	183817764422382438201	CTHNM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
251	RF	HWT2604	1051HG2696155-122	183817764422382441801	BGTYM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
252	RF	HWT2604	1051HG2696155-122	183817764422382443601	MKUSM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
253	RF	HWT2604	1051HG2696155-122	183817764422382445401	SCCPM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
254	RF	HWT2604	1051HG2696155-122	183817764422382447201	PNTHM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
255	RF	HWT2604	1051HG2696155-122	183817764422382450801	WHAAM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
256	RF	HWT2604	1051HG2696155-122	183817764422382452601	NNKAM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
257	RF	HWT2604	1051HG2696155-122	183817764422382454401	CRSNM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
258	RF	HWT2604	1051HG2696155-122	183817764422382456201	DKBKM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
259	RF	HWT2604	1051HG2696155-122	183817764422382458001	KGPEM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
260	RF	HWT2604	1051HG2696155-122	183817764422382459801	LHNKM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
261	RF	HWT2604	1051HG2696155-122	183817764422382461601	SSLKM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
262	RF	HWT2604	1051HG2696155-122	183817764422382463401	VIKGM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
263	RF	HWT2604	1051HG2696155-122	183817764422382465201	BBPYM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
264	RF	HWT2604	1051HG2696155-122	183817764422382467001	KNBPM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
265	RF	HWT2604	1051HG2696155-122	183817764422382468801	NKNMM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
266	RF	HWT2604	1051HG2696155-122	183817764422382470601	NMOKM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
267	RF	HWT2604	1051HG2696155-122	183817764422382476001	BGTCM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
268	RF	HWT2604	1051HG2696155-122	183817764422382477801	BPGYM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
269	RF	HWT2604	1051HG2696155-122	183817764422382479601	CWKWM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
270	RF	HWT2604	1051HG2696155-122	183817764422382481401	DIMNM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
271	RF	HWT2604	1051HG2696155-122	183817764422382483201	METSM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
272	RF	HWT2604	1051HG2696155-122	183817764422382485001	NOBDM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
273	RF	HWT2604	1051HG2696155-122	183817764422382486801	WPDNM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
274	RF	HWT2604	1051HG2696155-122	183817764422382488601	KKIWM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
275	RF	HWT2604	1051HG2696155-122	183817764422382490401	WHCWM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
276	RF	HWT2604	1051HG2696155-122	183817764422382492201	ANNLM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
277	RF	HWT2604	1051HG2696155-122	183817764422382494001	BMMKM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
278	RF	HWT2604	1051HG2696155-122	183817764422382495801	BSOIM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
279	RF	HWT2604	1051HG2696155-122	183817764422382497601	NSCGM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
280	RF	HWT2604	1051HG2696155-122	183817764422382499401	SPHLM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
281	RF	HWT2604	1051HG2696155-122	183817764422382501201	TPRTM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
282	RF	HWT2604	1051HG2696155-122	183817764422382503001	WYGEM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
283	RF	HWT2604	1051HG2696155-122	183817764422382506601	PNRYM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
284	RF	HWT2604	1051HG2696155-122	183817764422382508401	SGKGM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
285	RF	HWT2604	1051HG2696155-122	183817764422382510201	SGKSM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
286	RF	HWT2604	1051HG2696155-122	183817764422382512001	WKBGM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
287	RF	HWT2604	1051HG2696155-122	183817764422382513801	MPNGM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
288	RF	HWT2604	1051HG2696155-122	183817764422382515601	WGYNM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
289	RF	HWT2604	1051HG2696155-122	183817764422382519201	YNKKM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
290	RF	HWT2604	1051HG2696155-122	183817764422382521001	MBGAM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
291	RF	HWT2604	1051HG2696155-122	183817764422382522801	PTHAM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
292	RF	HWT2604	1051HG2696155-122	183817764422382524601	TBKOM	A_SSOA RF Optimization for 1 layer (easy) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
293	RF	HWT2604	1051HG2696155-122	183817764422382528201	WPURM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
294	RF	HWT2604	1051HG2696155-122	183817764422382530001	WTNLM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
295	RF	HWT2604	1051HG2696155-122	183817764422382531801	WNTDM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
296	RF	HWT2604	1051HG2696155-122	183817764422382533601	WHCSM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
297	RF	HWT2604	1051HG2696155-122	183817764422382535401	WTWAM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
298	RF	HWT2604	1051HG2696155-122	183817764422382537201	CBHPM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
299	RF	HWT2604	1051HG2696155-122	183817764422382539001	CBNNM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
300	RF	HWT2604	1051HG2696155-122	183817764422382540801	CTHNM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
301	RF	HWT2604	1051HG2696155-122	183817764422382542601	NNBNM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
302	RF	HWT2604	1051HG2696155-122	183817764422382544401	THDNM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
303	RF	HWT2604	1051HG2696155-122	183817764422382546201	NTONM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
304	RF	HWT2604	1051HG2696155-122	183817764422382548001	WKCCM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
305	RF	HWT2604	1051HG2696155-122	183817764422382549801	TTNCM	A_Cluster RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
306	RF	HWT2604	1051HG2696155-122	183817764422382551601	WAMAM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
307	RF	HWT2604	1051HG2696155-122	183817764422382555201	KMTAM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
308	RF	HWT2604	1051HG2696155-122	183817764422382557001	KNONM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
309	RF	HWT2604	1051HG2696155-122	183817764422382558801	PGASM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
310	RF	HWT2604	1051HG2696155-122	183817764422382560601	CAKCM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
311	RF	HWT2604	1051HG2696155-122	183817764422382562401	KTTNM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
312	RF	HWT2304	1051HG2997963-356	183829439002504398201	SKO7290	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0218-Border-2	\N	13.972853,102.787331	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
313	RF	HWT2304	1051HG2997963-356	183829439002504399201	SKO7291	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0218-Border-2	\N	13.965128,102.787023	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
314	RF	HWT2304	1051HG2997963-356	183829439002504400201	SKO7298	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0217-Border-1	\N	13.781101,102.706501	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
315	RF	HWT2304	1051HG2997963-356	183829439002504401201	SKO7299	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0215-Border-1	\N	13.763461,102.660524	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
316	RF	HWT2304	1051HG2997963-357	184029977038796393601	CTB7238	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0187-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
317	RF	HWT2304	1051HG2997963-357	184029977038796395401	CTB7239	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0187-Border-1	\N	\N	2026-03-18	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
318	RF	HWT2304	1051HG2997963-357	184029977038796397201	CTB7240	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0187-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
319	RF	HWT2304	1051HG2997963-357	184029977038796399001	CTB7241	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0188-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
320	RF	HWT2304	1051HG2997963-357	184029977038796400801	CTB7242	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0187-Border-2	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
321	RF	HWT2304	1051HG2997963-357	184029977038796402601	CTB7243	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0187-Border-2	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
322	RF	HWT2304	1051HG2997963-357	184029977038796404401	CTB7244	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0188-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
323	RF	HWT2304	1051HG2997963-357	184029977038796406201	CTB7245	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_2 sectors	EAS0188-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
324	RF	HWT2304	1051HG2997963-357	184029977038796408001	SKO7287	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0219-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
325	RF	HWT2304	1051HG2997963-357	184029977038796409801	SKO7288	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0219-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
326	RF	HWT2304	1051HG2997963-357	184029977038796411601	SKO7289	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0219-Border-2	\N	\N	2026-03-20	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
327	RF	HWT2304	1051HG2997963-357	184029977038796413401	SKO7290	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0218-Border-2	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
328	RF	HWT2304	1051HG2997963-357	184029977038796415201	SKO7291	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0218-Border-2	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
329	RF	HWT2304	1051HG2997963-357	184029977038796417001	SKO7292	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0218-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
330	RF	HWT2304	1051HG2997963-357	184029977038796418801	SKO7293	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0218-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
331	RF	HWT2304	1051HG2997963-357	184029977038796420601	SKO7294	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0218-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
332	RF	HWT2304	1051HG2997963-357	184029977038796422401	SKO7295	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0217-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
333	RF	HWT2304	1051HG2997963-357	184029977038796424201	SKO7296	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0217-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
334	RF	HWT2304	1051HG2997963-357	184029977038796426001	SKO7297	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0217-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
335	RF	HWT2304	1051HG2997963-357	184029977038796427801	SKO7298	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0217-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
336	RF	HWT2304	1051HG2997963-357	184029977038796429601	SKO7299	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0215-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
337	RF	HWT2304	1051HG2997963-357	184029977038796431401	SKO7600	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0214-Border-1	\N	\N	2026-03-10	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
338	RF	HWT2304	1051HG2997963-357	184029977038796433201	SKO7601	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0214-Border-1	\N	\N	2026-03-10	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
339	RF	HWT2304	1051HG2997963-357	184029977038796435001	SKO7602	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0214-Border-1	\N	\N	2026-03-11	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
340	RF	HWT2304	1051HG2997963-357	184029977038796436801	SKO7603	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0214-Border-1	\N	\N	2026-03-10	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
341	RF	HWT2304	1051HG2997963-357	184029977038796438601	SKO7604	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0213-Border-1	\N	\N	2026-03-18	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
342	RF	HWT2304	1051HG2997963-357	184029977038796440401	SKO7605	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0213-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
343	RF	HWT2304	1051HG2997963-357	184029977038796442201	SKO7606	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0213-Border-1	\N	\N	2026-03-10	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
344	RF	HWT2304	1051HG2997963-357	184029977038796444001	SKO7607	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0213-Border-1	\N	\N	2026-03-10	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
345	RF	HWT2304	1051HG2997963-357	184029977038796445801	SKO7608	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0184-Border-1	\N	\N	2026-03-10	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
346	RF	HWT2304	1051HG2997963-357	184029977038796447601	SKO7609	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0213-Border-2	\N	\N	2026-03-10	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
347	RF	HWT2304	1051HG2997963-357	184029977038796449401	SKO7610	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0213-Border-3	\N	\N	2026-03-20	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
348	RF	HWT2304	1051HG2997963-357	184029977038796451201	SKO7611	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0213-Border-2	\N	\N	2026-03-10	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
349	RF	HWT2304	1051HG2997963-357	184029977038796453001	SKO7612	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0213-Border-2	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
350	RF	HWT2304	1051HG2997963-357	184029977038796454801	SKO7613	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0213-Border-2	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
351	RF	HWT2304	1051HG2997963-357	184029977038796456601	SKO7614	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0184-Border-1	\N	\N	2026-03-10	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
352	RF	HWT2304	1051HG2997963-357	184029977038796458401	SKO7615	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_2 sectors	EAS0184-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
353	RF	HWT2304	1051HG2997963-357	184029977038796460201	SKO7616	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0219-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
354	RF	HWT2304	1051HG2997963-357	184029977038796462001	SKO7617	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0219-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
355	RF	HWT2304	1051HG2997963-357	184029977038796463801	SKO7618	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0184-Border-1	\N	\N	2026-03-20	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
356	RF	HWT2304	1051HG2997963-357	184029977038796465601	TRT7182	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-3	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
357	RF	HWT2304	1051HG2997963-357	184029977038796467401	TRT7183	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-3	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
358	RF	HWT2304	1051HG2997963-357	184029977038796469201	TRT7184	B_SSOA DT Optimization for 1~3 layers	EAS0129-Border-2	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
359	RF	HWT2304	1051HG2997963-357	184029977038796471001	TRT7185	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-2	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
360	RF	HWT2304	1051HG2997963-357	184029977038796472801	TRT7186	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
361	RF	HWT2304	1051HG2997963-357	184029977038796474601	TRT7187	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-1	\N	\N	2026-03-10	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
362	RF	HWT2304	1051HG2997963-357	184029977038796476401	TRT7188	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-1	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
363	RF	HWT2304	1051HG2997963-357	184029977038796478201	TRT7189	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_2 sectors	EAS0129-Border-4	\N	\N	2026-03-20	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
364	RF	HWT2304	1051HG2997963-357	184029977038796480001	TRT7190	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-5	\N	\N	2026-03-20	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
365	RF	HWT2304	1051HG2997963-357	184029977038796481801	TRT7191	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-5	\N	\N	2026-03-20	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
366	RF	HWT2304	1051HG2997963-357	184029977038796483601	TRT7192	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-3	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
367	RF	HWT2304	1051HG2997963-357	184029977038796485401	TRT7193	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-3	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
368	RF	HWT2304	1051HG2997963-357	184029977038796487201	TRT7194	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-2	\N	\N	2026-03-10	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
369	RF	HWT2304	1051HG2997963-357	184029977038796489001	TRT7195	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-2	\N	\N	2026-03-13	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
370	RF	HWT2304	1051HG2997963-357	184029977038796490801	TRT7196	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0129-Border-1	\N	\N	2026-03-10	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
371	RF	HWT2304	1051HG2997963-358	184040607941859738601	SKO7296	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0217-Border-1	\N	13.787461,102.715611	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
372	RF	HWT2304	1051HG2997963-358	184040607941859739601	SKO7297	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	EAS0217-Border-1	\N	13.784801,102.710901	2026-03-13	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
373	RF	HWT2304	1051HG2997963-359	184041407664765338401	MEDIU	B_Medium NPM drive test, analysis and optimization services (region/month)	\N	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
374	RF	HWT2304	1051HG2997963-361	184473770856148173601	CBI0679	B_SSOA DT Optimization for 1~3 layers_2 sectors	EAS0098-SSOA-2	\N	\N	2026-02-05	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
375	RF	HWT2304	1051HG2997963-361	184473770856148175401	CBI0124	B_SSOA DT Optimization for 1~3 layers_2 sectors	EAS0152-SSOA-1	\N	\N	2026-03-20	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
376	RF	HWT2304	1051HG2997963-361	184473770856148177201	CCO0415	B_SSOA DT Optimization for 4~5 layers	EAS0192-SSOA-2	\N	\N	2026-01-28	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
377	RF	HWT2304	1051HG2997963-361	184473770856148179001	CTB6712	B_SSOA DT Optimization for 6~7 layers	EAS0189-SSOA-2	\N	\N	\N	6~7 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
378	RF	HWT2304	1051HG2997963-360	184473770856157185001	RYG0006	B_SSOA DT Optimization for 1~3 layers	EAS0073-SSOA-3	\N	\N	2026-02-05	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
411	RF	HWT2604	1051HG2696155-123	185058548693118214401	CPWHM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
379	RF	HWT2304	1051HG2997963-360	184473770856157186801	CBI0161	B_SSOA DT Optimization for 1~3 layers_2 sectors	EAS0099-SSOA-1	\N	\N	2026-03-02	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
380	RF	HWT2304	1051HG2997963-360	184473770856157188601	CBI0246	B_SSOA DT Optimization for 1~3 layers_1 sector	EAS0051-SSOA-1	\N	\N	2026-03-02	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
381	RF	HWT2304	1051HG2997963-360	184473770856157190401	RYG0006	B_SSOA DT Optimization for 1~3 layers	EAS0073-SSOA-3	\N	\N	2026-02-05	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
382	RF	HWT2604	1051HG2696155-123	185058548693118162201	HONGM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
383	RF	HWT2604	1051HG2696155-123	185058548693118164001	KSHLM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
384	RF	HWT2604	1051HG2696155-123	185058548693118165801	LHBKM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
385	RF	HWT2604	1051HG2696155-123	185058548693118167601	NCTSM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
386	RF	HWT2604	1051HG2696155-123	185058548693118169401	RFRYM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
387	RF	HWT2604	1051HG2696155-123	185058548693118171201	TUNMM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
388	RF	HWT2604	1051HG2696155-123	185058548693118173001	PYCAM	A_SSOA RF Optimization for 1 layer (easy) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
389	RF	HWT2604	1051HG2696155-123	185058548693118174801	KNWAM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
390	RF	HWT2604	1051HG2696155-123	185058548693118176601	RCBKM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
391	RF	HWT2604	1051HG2696155-123	185058548693118178401	WNUKM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
392	RF	HWT2604	1051HG2696155-123	185058548693118180201	NKDNM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
393	RF	HWT2604	1051HG2696155-123	185058548693118182001	WHNSM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
394	RF	HWT2604	1051HG2696155-123	185058548693118183801	BMTIM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
395	RF	HWT2604	1051HG2696155-123	185058548693118185601	TJKCM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
396	RF	HWT2604	1051HG2696155-123	185058548693118187401	MWPYM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
397	RF	HWT2604	1051HG2696155-123	185058548693118189201	SKDNM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
398	RF	HWT2604	1051HG2696155-123	185058548693118191001	PYCOM	A_SSOA RF Optimization for 1 layer (easy)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
399	RF	HWT2604	1051HG2696155-123	185058548693118192801	YHKPM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
400	RF	HWT2604	1051HG2696155-123	185058548693118194601	TPECM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
401	RF	HWT2604	1051HG2696155-123	185058548693118196401	MAPTM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
402	RF	HWT2604	1051HG2696155-123	185058548693118198201	WHCSM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
403	RF	HWT2604	1051HG2696155-123	185058548693118200001	BTJMM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
404	RF	HWT2604	1051HG2696155-123	185058548693118201801	MKAOM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
405	RF	HWT2604	1051HG2696155-123	185058548693118203601	KBNSM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
406	RF	HWT2604	1051HG2696155-123	185058548693118205401	CBMKM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
407	RF	HWT2604	1051HG2696155-123	185058548693118207201	KGKNM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
408	RF	HWT2604	1051HG2696155-123	185058548693118209001	TTCTM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
409	RF	HWT2604	1051HG2696155-123	185058548693118210801	RSKBM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
410	RF	HWT2604	1051HG2696155-123	185058548693118212601	KBOPM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
412	RF	HWT2604	1051HG2696155-123	185058548693118216201	PKCEM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
413	RF	HWT2604	1051HG2696155-123	185058548693118218001	CMRJM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
414	RF	HWT2604	1051HG2696155-123	185058548693118219801	HAMHM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
415	RF	HWT2604	1051HG2696155-123	185058548693118221601	TLSCM	A_Cluster RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
416	RF	HWT2604	1051HG2696155-123	185058548693118223401	GFNTM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
417	RF	HWT2604	1051HG2696155-123	185058548693118225201	CMETM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
418	RF	HWT2604	1051HG2696155-123	185058548693118227001	BOBKM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
419	RF	HWT2604	1051HG2696155-123	185058548693118228801	KHASM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
420	RF	HWT2604	1051HG2696155-123	185058548693118230601	NWKYM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
421	RF	HWT2604	1051HG2696155-123	185058548693118232401	RNIEM	A_Cluster RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
422	RF	HWT2604	1051HG2696155-123	185058548693118234201	NREKM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
423	RF	HWT2604	1051HG2696155-123	185058548693118236001	CNMTM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
424	RF	HWT2604	1051HG2696155-123	185058548693118237801	DNRNM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
425	RF	HWT2604	1051HG2696155-123	185058548693118239601	GDPCM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
426	RF	HWT2604	1051HG2696155-124	185062131554851227001	CBMKM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
427	RF	HWT2304	1051HG2997963-362	185094475235611443601	CBRA486	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
428	RF	HWT2304	1051HG2997963-362	185094475235611444601	CBRA490	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
429	RF	HWT2304	1051HG2997963-362	185094475235611445601	CBRA492	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
430	RF	HWT2304	1051HG2997963-362	185094475235611446601	CBRA507	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
431	RF	HWT2304	1051HG2997963-362	185094475235611447601	CBRA510	B_Single Site Verification for 10 or more than 10 layers_2 Operators with partial DT	\N	\N	\N	\N	10 or more than 10 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
432	RF	HWT2304	1051HG2997963-362	185094475235611448601	CBRA519	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
433	RF	HWT2304	1051HG2997963-362	185094475235611449601	CCS7914	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
434	RF	HWT2304	1051HG2997963-362	185094475235611450601	CBRA521	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
435	RF	HWT2304	1051HG2997963-362	185094475235611451601	RYG6430	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
436	RF	HWT2304	1051HG2997963-362	185094475235611452601	RYG6431	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
437	RF	HWT2304	1051HG2997963-362	185094475235611453601	RYG6432	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
438	RF	HWT2304	1051HG2997963-362	185094475235611454601	RYG6433	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
439	RF	HWT2304	1051HG2997963-362	185094475235611455601	CCS7917	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 Operators with partial DT	\N	\N	\N	\N	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
440	RF	HWT2304	1051HG2997963-362	185094475235611456601	CBRA525	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
441	RF	HWT2304	1051HG2997963-362	185094475235611457601	CBRA528	B_Single Site Verification for 8~9 layers_2 Operators with partial DT	\N	\N	\N	\N	8~9 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
442	RF	HWT2304	1051HG2997963-363	185094476094605723401	RYG6410	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
443	RF	HWT2304	1051HG2997963-363	185094476094605724401	RYG6418	B_Single Site Verification for 10 or more than 10 layers_2 Operators with partial DT	\N	\N	\N	\N	10 or more than 10 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
444	RF	HWT2304	1051HG2997963-363	185094476094605725401	CBRA448	B_Single Site Verification for Small Cell for 4-5 layers (BBU)_2 Operators with partial DT	\N	\N	\N	\N	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
445	RF	HWT2304	1051HG2997963-363	185094476094605726401	CBRA449	B_Single Site Verification for Small Cell for 4-5 layers (BBU)_2 Operators with partial DT	\N	\N	\N	\N	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
446	RF	HWT2304	1051HG2997963-363	185094476094605727401	CBRA455	B_Single Site Verification for Small Cell for 4-5 layers (BBU)_2 Operators with partial DT	\N	\N	\N	\N	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
447	RF	HWT2304	1051HG2997963-363	185094476094605728401	CBRA459	B_Single Site Verification for Small Cell for 4-5 layers (BBU)_2 Operators with partial DT	\N	\N	\N	\N	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
448	RF	HWT2304	1051HG2997963-363	185094476094605729401	CCS7689	B_Single Site Verification for 6~7 layers_2 Operators with partial DT	\N	\N	13.579541,100.941901	\N	6~7 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
449	RF	HWT2304	1051HG2997963-363	185094476094605730401	CCS7905	B_Single Site Verification for Small Cell for 4-5 layers (BBU)_2 Operators with partial DT	\N	\N	13.596271,100.950531	\N	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
450	RF	HWT2304	1051HG2997963-363	185094476094605731401	CCS7906	B_Single Site Verification for Small Cell for 4-5 layers (BBU)_2 Operators with partial DT	\N	\N	13.596151,100.951831	\N	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
451	RF	HWT2304	1051HG2997963-363	185094476094605732401	CBRA481	B_Single Site Verification for Small Cell for 4-5 layers (BBU)_2 Operators with partial DT	\N	\N	\N	\N	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
452	RF	HWT2304	1051HG2997963-363	185094476094605733401	CBRA482	B_Single Site Verification for Small Cell for 4-5 layers (BBU)_2 Operators with partial DT	\N	\N	\N	\N	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
453	RF	HWT2304	1051HG2997963-363	185094476094605734401	CBRA484	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
454	RF	HWT2304	1051HG2997963-364	185094476953593447201	RYG6408	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
455	RF	HWT2304	1051HG2997963-364	185094476953593448201	RYG6409	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
456	RF	HWT2304	1051HG2997963-364	185094476953593449201	RYG6415	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
457	RF	HWT2304	1051HG2997963-364	185094476953593450201	CBR7520	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	12.966439,100.906557	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
458	RF	HWT2304	1051HG2997963-364	185094476953593451201	CBR7523	B_Single Site Verification for 4~5 layers_2 sectors_2 Operators with partial DT	\N	\N	12.967057,100.905702	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
459	RF	HWT2304	1051HG2997963-365	185094499287422568001	RYG6408	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
460	RF	HWT2304	1051HG2997963-365	185094499287422569801	RYG6409	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
461	RF	HWT2304	1051HG2997963-365	185094499287422571601	RYG6415	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
462	RF	HWT2304	1051HG2997963-365	185094499287422573401	CBR7520	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
463	RF	HWT2304	1051HG2997963-365	185094499287422575201	CBR7523	B_SSOA DT Optimization for 1~3 layers_2 sectors	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
464	RF	HWT2304	1051HG2997963-366	185352158671031501401	RYG0448	B_SSOA DT Optimization for 4~5 layers	EAS0110-SSOA-2	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
465	RF	HWT2304	1051HG2997963-366	185352158671031503201	CCS6718	B_SSOA DT Optimization for 1~3 layers_2 sectors	EAS0158-SSOA-1	\N	\N	2026-04-20	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
466	RF	HWT2304	1051HG2997963-368	185352162106999606601	CCO0214	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_2 sectors	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
467	RF	HWT2304	1051HG2997963-368	185352162106999608401	CCO0070	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	EAS0012-SSOA-2	\N	\N	2026-04-28	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
468	RF	HWT2304	1051HG2997963-368	185352162106999610201	RYG0222	B_SSOA DT Optimization for 1~3 layers_2 sectors	EAS0076-SSOA-2	\N	\N	2026-03-20	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
469	RF	HWT2304	1051HG2997963-368	185352162106999612001	CBR7995	B_SSOA DT Optimization for 4~5 layers	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
470	RF	HWT2304	1051HG2997963-368	185352162106999613801	CBI0321	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
471	RF	HWT2304	1051HG2997963-368	185352162106999615601	CBI0150	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_1 sector	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
472	RF	HWT2304	1051HG2997963-368	185352162106999617401	RYG0005	B_SSOA DT Optimization for 6~7 layers	EAS0080-SSOA-1	\N	\N	\N	6~7 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
473	RF	HWT2304	1051HG2997963-368	185352162106999619201	CBI0926	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
474	RF	HWT2304	1051HG2997963-368	185352162106999621001	RYG0372	B_SSOA DT Optimization for 1~3 layers	EAS0141-SSOA-1	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
475	RF	HWT2304	1051HG2997963-368	185352162106999622801	CCO0085	B_SSOA DT Optimization for 1~3 layers_2 sectors	EAS0160-SSOA-1	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
476	RF	HWT2304	1051HG2997963-368	185352162106999624601	RYG0580	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
477	RF	HWT2304	1051HG2997963-368	185352162106999626401	BKK0214	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_2 sectors	\N	\N	\N	2026-04-30	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
478	RF	HWT2304	1051HG2997963-368	185352162106999628201	CBI1295	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_2 sectors	EAS0019-SSOA-1	\N	\N	2026-03-20	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
479	RF	HWT2304	1051HG2997963-368	185352162106999630001	CBRA505	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_2 sectors	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
480	RF	HWT2304	1051HG2997963-368	185352162106999631801	RYG0352	B_SSOA DT Optimization for 1~3 layers	EAS0102-SSOA-1	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
481	RF	HWT2304	1051HG2997963-368	185352162106999633601	CBI0293	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	2026-04-20	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
482	RF	HWT2304	1051HG2997963-368	185352162106999635401	CBR1842	B_SSOA DT Optimization for 1~3 layers	EAS0049-SSOA-1	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
483	RF	HWT2304	1051HG2997963-367	185352162107001242401	CBR6823	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_2 sectors	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
484	RF	HWT2304	1051HG2997963-367	185352162107001244201	CBI0644	B_SSOA DT Optimization for 1~3 layers_2 sectors	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
485	RF	HWT2304	1051HG2997963-369	185352166401968544201	CBR6823	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 sectors_2 Operators with partial DT	\N	\N	12.942441,100.885641	\N	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
486	RF	HWT2304	1051HG2997963-369	185352166401968545201	CBI0644	B_Single Site Verification for 1~3 layers_2 sectors_2 Operators with partial DT	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
487	RF	HWT2304	1051HG2997963-371	185352194748755972401	RYG6425	B_SSOA DT Optimization for Small cell for 6~7 layers (BBU)_2 sectors	\N	\N	\N	\N	6~7 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
488	RF	HWT2304	1051HG2997963-371	185352194748755974201	CCS7909	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
489	RF	HWT2304	1051HG2997963-371	185352194748755976001	RYG6426	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
490	RF	HWT2304	1051HG2997963-371	185352194748755977801	RYG6428	B_SSOA DT Optimization for 4~5 layers	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
491	RF	HWT2304	1051HG2997963-371	185352194748755979601	CCS7920	B_SSOA DT Optimization for 4~5 layers	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
492	RF	HWT2304	1051HG2997963-371	185352194748755981401	CBRA520	B_SSOA DT Optimization for 6~7 layers	EAS0066-SSOA-1	\N	\N	2026-04-21	6~7 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
493	RF	HWT2304	1051HG2997963-371	185352194748755983201	CCS7697	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
494	RF	HWT2304	1051HG2997963-371	185352194748755985001	CBRA523	B_SSOA DT Optimization for 8~9 layers	EAS0029-SSOA-1	\N	\N	2026-03-16	8~9 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
495	RF	HWT2304	1051HG2997963-371	185352194748755986801	CBRA526	B_SSOA DT Optimization for 4~5 layers	EAS0038-SSOA-2	\N	\N	2026-04-20	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
496	RF	HWT2304	1051HG2997963-371	185352194748755988601	CCS7698	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
497	RF	HWT2304	1051HG2997963-371	185352194748755990401	CBRA440	B_SSOA DT Optimization for 4~5 layers	EAS0033-SSOA-2	\N	\N	2026-04-21	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
498	RF	HWT2304	1051HG2997963-371	185352194748755992201	CBRA485	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
499	RF	HWT2304	1051HG2997963-371	185352194748755994001	CBR7316	B_SSOA DT Optimization for 8~9 layers	\N	\N	\N	\N	8~9 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
500	RF	HWT2304	1051HG2997963-371	185352194748755995801	CBRA470	B_SSOA DT Optimization for 1~3 layers	EAS0150-SSOA-1	\N	\N	2026-03-25	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
501	RF	HWT2304	1051HG2997963-371	185352194748755997601	RYG7345	B_SSOA DT Optimization for 8~9 layers	\N	\N	\N	\N	8~9 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
502	RF	HWT2304	1051HG2997963-371	185352194748755999401	RYG7346	B_SSOA DT Optimization for 8~9 layers	\N	\N	\N	\N	8~9 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
503	RF	HWT2304	1051HG2997963-370	185352194748760884201	CBR5941	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_2 sectors	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
504	RF	HWT2304	1051HG2997963-370	185352194748760886001	RYG6406	B_SSOA DT Optimization for 6~7 layers	\N	\N	\N	\N	6~7 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
505	RF	HWT2304	1051HG2997963-370	185352194748760887801	CBR6474	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)_1 sector	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
506	RF	HWT2304	1051HG2997963-370	185352194748760889601	CBR2012	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
507	RF	HWT2304	1051HG2997963-372	185352199902722459001	CBR5941	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_2 sectors_2 Operators with partial DT	\N	\N	12.926332,100.873116	\N	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
508	RF	HWT2304	1051HG2997963-372	185352199902722460001	RYG6406	B_Single Site Verification for 8~9 layers_2 Operators with partial DT	\N	\N	\N	\N	8~9 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
509	RF	HWT2304	1051HG2997963-372	185352199902722461001	CBR6474	B_Single Site Verification for Small Cell for 1-3 layers (BBU)_1 sector_2 Operators with partial DT	\N	\N	13.424767,101.017458	\N	1-3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
510	RF	HWT2304	1051HG2997963-372	185352199902722462001	CBR2012	B_Single Site Verification for 1~3 layers_2 Operators with partial DT	\N	\N	12.935548,100.973545	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
511	RF	HWT2304	1051HG2997963-373	185352200761711821801	CCS7920	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	13.587625,100.943721	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
512	RF	HWT2304	1051HG2997963-373	185352200761711822801	CBRA520	B_Single Site Verification for 8~9 layers_2 Operators with partial DT	EAS0066-SSOA-1	\N	12.965474,100.946864	2026-04-21	8~9 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
513	RF	HWT2304	1051HG2997963-373	185352200761711823801	CCS7697	B_Single Site Verification for Small Cell for 4-5 layers (BBU)_2 Operators with partial DT	\N	\N	\N	\N	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
514	RF	HWT2304	1051HG2997963-373	185352200761711824801	CBRA523	B_Single Site Verification for 10 or more than 10 layers_2 Operators with partial DT	EAS0029-SSOA-1	\N	13.339147,100.949838	2026-03-16	10 or more than 10 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
515	RF	HWT2304	1051HG2997963-373	185352200761711825801	CBRA526	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	EAS0038-SSOA-2	\N	13.163217,100.953343	2026-04-20	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
516	RF	HWT2304	1051HG2997963-373	185352200761711826801	CCS7698	B_Single Site Verification for Small Cell for 4-5 layers (BBU)_2 Operators with partial DT	\N	\N	\N	\N	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
517	RF	HWT2304	1051HG2997963-373	185352200761711827801	CBRA485	B_Single Site Verification for 4~5 layers_2 Operators with partial DT	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
518	RF	HWT2304	1051HG2997963-373	185352200761711828801	CBR7316	B_Single Site Verification for 10 or more than 10 layers_2 Operators with partial DT	\N	\N	\N	\N	10 or more than 10 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
519	RF	HWT2304	1051HG2997963-373	185352200761711829801	RYG7345	B_Single Site Verification for 10 or more than 10 layers_2 Operators with partial DT	\N	\N	\N	\N	10 or more than 10 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
520	RF	HWT2304	1051HG2997963-373	185352200761711830801	RYG7346	B_Single Site Verification for 10 or more than 10 layers_2 Operators with partial DT	\N	\N	\N	\N	10 or more than 10 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
521	RF	HWT2304	1051HG2997963-373	185352200761711831801	RYG6425	B_Single Site Verification for Small Cell for 10 or more than 10 layers (BBU)_2 sectors_2 Operators with partial DT	\N	\N	\N	\N	10 or more than 10 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
522	RF	HWT2304	1051HG2997963-373	185352200761711832801	CCS7909	B_Single Site Verification for Small Cell for 4-5 layers (BBU)_2 Operators with partial DT	\N	\N	\N	\N	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
523	RF	HWT2304	1051HG2997963-373	185352200761711833801	RYG6426	B_Single Site Verification for 1~3 layers_2 Operators with partial DT	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
524	RF	HWT2304	1051HG2997963-373	185352200761711834801	RYG6428	B_Single Site Verification for 8~9 layers_2 Operators with partial DT	\N	\N	\N	\N	8~9 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
525	RF	HWT2304	1051HG2997963-374	185352208492658693601	RYG6410	B_SSOA DT Optimization for 4~5 layers	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
526	RF	HWT2304	1051HG2997963-374	185352208492658695401	RYG6418	B_SSOA DT Optimization for 6~7 layers	\N	\N	\N	\N	6~7 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
527	RF	HWT2304	1051HG2997963-374	185352208492658697201	CBRA448	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
528	RF	HWT2304	1051HG2997963-374	185352208492658699001	CBRA449	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
529	RF	HWT2304	1051HG2997963-374	185352208492658700801	CBRA455	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
530	RF	HWT2304	1051HG2997963-374	185352208492658702601	CBRA459	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
531	RF	HWT2304	1051HG2997963-374	185352208492658704401	CCS7689	B_SSOA DT Optimization for 6~7 layers	\N	\N	\N	\N	6~7 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
532	RF	HWT2304	1051HG2997963-374	185352208492658706201	CCS7905	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
533	RF	HWT2304	1051HG2997963-374	185352208492658708001	CCS7906	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
534	RF	HWT2304	1051HG2997963-374	185352208492658709801	CBRA481	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
535	RF	HWT2304	1051HG2997963-374	185352208492658711601	CBRA482	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
536	RF	HWT2304	1051HG2997963-374	185352208492658713401	CBRA484	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
537	RF	HWT2304	1051HG2997963-374	185352208492658715201	CBRA486	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
538	RF	HWT2304	1051HG2997963-374	185352208492658717001	CBRA490	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
539	RF	HWT2304	1051HG2997963-374	185352208492658718801	CBRA492	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
540	RF	HWT2304	1051HG2997963-374	185352208492658720601	CBRA507	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
541	RF	HWT2304	1051HG2997963-374	185352208492658722401	CBRA510	B_SSOA DT Optimization for 6~7 layers	\N	\N	\N	\N	6~7 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
542	RF	HWT2304	1051HG2997963-374	185352208492658724201	CBRA519	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
543	RF	HWT2304	1051HG2997963-374	185352208492658726001	CCS7914	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
544	RF	HWT2304	1051HG2997963-374	185352208492658727801	CBRA521	B_SSOA DT Optimization for 4~5 layers	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
545	RF	HWT2304	1051HG2997963-374	185352208492658729601	RYG6430	B_SSOA DT Optimization for 4~5 layers	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
546	RF	HWT2304	1051HG2997963-374	185352208492658731401	RYG6431	B_SSOA DT Optimization for 4~5 layers	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
547	RF	HWT2304	1051HG2997963-374	185352208492658733201	RYG6432	B_SSOA DT Optimization for 4~5 layers	\N	\N	\N	\N	4~5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
548	RF	HWT2304	1051HG2997963-374	185352208492658735001	RYG6433	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
549	RF	HWT2304	1051HG2997963-374	185352208492658736801	CCS7917	B_SSOA DT Optimization for Small cell for 1~3 layers (BBU)	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
550	RF	HWT2304	1051HG2997963-374	185352208492658738601	CBRA525	B_SSOA DT Optimization for 1~3 layers	\N	\N	\N	\N	1~3 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
551	RF	HWT2304	1051HG2997963-374	185352208492658740401	CBRA528	B_SSOA DT Optimization for 6~7 layers	\N	\N	\N	\N	6~7 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
552	RF	HWT2304	1051HG3675965-1	185602237437151644001	CBR0249	B_Cluster DT Optimization for 2 bands_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	\N	2026-04-02	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
553	RF	HWT2304	1051HG3675965-1	185602237437151645801	CBR0685	B_Cluster DT Optimization for 1 band_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	\N	2026-03-30	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
554	RF	HWT2304	1051HG3675965-1	185602237437151647601	CBR1611	B_Cluster DT Optimization for 2 bands_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
555	RF	HWT2304	1051HG3675965-1	185602237437151649401	CBR2031	B_Cluster DT Optimization for 2 bands_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
556	RF	HWT2304	1051HG3675965-1	185602237437151651201	CBR6403	B_Cluster DT Optimization for 2 bands_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
557	RF	HWT2304	1051HG3675965-1	185602237437151653001	CBR7002	B_Cluster DT Optimization for 2 bands_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
558	RF	HWT2304	1051HG3675965-1	185602237437151654801	CBR7009	B_Cluster DT Optimization for 2 bands_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
559	RF	HWT2304	1051HG3675965-1	185602237437151656601	CBR7037	B_Cluster DT Optimization for 2 bands_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
560	RF	HWT2304	1051HG3675965-1	185602237437151658401	CBR8505	B_Cluster DT Optimization for 2 bands_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
561	RF	HWT2304	1051HG3675965-1	185602237437151660201	CBRA414	B_Cluster DT Optimization for 2 bands_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
562	RF	HWT2304	1051HG3675965-2	185606170768200500601	CBR6403	B_Single Site Verification for 3 layers_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	12.915861,100.904051	\N	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
563	RF	HWT2304	1051HG3675965-2	185606170768200501601	CBR7002	B_Single Site Verification for 3 layers_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	12.909581,100.902061	\N	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
564	RF	HWT2304	1051HG3675965-2	185606170768200502601	CBR7009	B_Single Site Verification for 3 layers_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	12.894741,100.910281	\N	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
565	RF	HWT2304	1051HG3675965-2	185606170768200503601	CBR7037	B_Single Site Verification for 3 layers_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	12.915891,100.915571	\N	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
566	RF	HWT2304	1051HG3675965-2	185606170768200504601	CBR8505	B_Single Site Verification for 3 layers_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	12.898581,100.902891	\N	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
567	RF	HWT2304	1051HG3675965-2	185606170768200505601	CBR0249	B_Single Site Verification for 3 layers_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	12.909722,100.916111	2026-04-02	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
568	RF	HWT2304	1051HG3675965-2	185606170768200506601	CBR0685	B_Single Site Verification for 1 layers_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	12.903731,100.901981	2026-03-30	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
569	RF	HWT2304	1051HG3675965-2	185606170768200507601	CBR1611	B_Single Site Verification for 3 layers_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	12.907081,100.909251	\N	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
570	RF	HWT2304	1051HG3675965-2	185606170768200508601	CBRA414	B_Single Site Verification for 3 layers_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	12.898511,100.912271	\N	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
571	RF	HWT2304	1051HG3675965-2	185606170768200509601	CBR2031	B_Single Site Verification for 3 layers_3 or more than 3 sectors for macro site scenario	EAS-FLASH-POC	\N	12.922551,100.907741	\N	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
572	RF	HWT2304	1051HG3675965-3	185816538266713295401	CBR8505	B_Pre DT and report for Macro site	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
573	RF	HWT2304	1051HG3675965-3	185816538266713296401	CBR0249	B_Pre DT and report for Macro site	EAS-FLASH-POC	\N	\N	2026-04-02	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
574	RF	HWT2304	1051HG3675965-3	185816538266713297401	CBR0685	B_Pre DT and report for Macro site	EAS-FLASH-POC	\N	\N	2026-03-30	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
575	RF	HWT2304	1051HG3675965-3	185816538266713298401	CBR1611	B_Pre DT and report for Macro site	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
576	RF	HWT2304	1051HG3675965-3	185816538266713299401	CBRA414	B_Pre DT and report for Macro site	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
577	RF	HWT2304	1051HG3675965-3	185816538266713300401	CBR2031	B_Pre DT and report for Macro site	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
578	RF	HWT2304	1051HG3675965-3	185816538266713301401	CBR6403	B_Pre DT and report for Macro site	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
579	RF	HWT2304	1051HG3675965-3	185816538266713302401	CBR7002	B_Pre DT and report for Macro site	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
580	RF	HWT2304	1051HG3675965-3	185816538266713303401	CBR7009	B_Pre DT and report for Macro site	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
581	RF	HWT2304	1051HG3675965-3	185816538266713304401	CBR7037	B_Pre DT and report for Macro site	EAS-FLASH-POC	\N	\N	\N	\N	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
582	RF	HWT2304	1051HG3675965-4	185838100720585116001	SKO7205	B_Single Site Verification for 3 layer_2 sector for Macro site Scenario	EAS0182-SSOA-CD-1	\N	13.578341,102.023861	2025-12-03	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
583	RF	HWT2304	1051HG3675965-4	185838100720585117001	CBR7104	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS9008-SSOA-1	\N	13.451999,101.354162	2025-12-03	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
584	RF	HWT2304	1051HG3675965-4	185838100720585118001	CBR7348	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS9008-SSOA-1	\N	13.309484,100.911692	2025-02-03	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
585	RF	HWT2304	1051HG3675965-4	185838100720585119001	CBR5841	B_Single Site Verification for 3 layer_2 sector for Macro site Scenario	EAS0061-Full-1	\N	12.925934,100.884765	2025-04-04	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
586	RF	HWT2304	1051HG3675965-4	185838100720585120001	CBR5948	B_Single Site Verification for 3 layer_2 sector for Macro site Scenario	EAS0051-Full-1	\N	13.124091,100.992501	2000-01-01	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
587	RF	HWT2304	1051HG3675965-4	185838100720585121001	CBR7128	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS0091-Full-1	\N	12.704347,100.861913	2025-06-06	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
588	RF	HWT2304	1051HG3675965-4	185838100720585122001	PCR7210	B_Single Site Verification for 3 layer_2 sector for Macro site Scenario	EAS0163-Full-1	\N	13.788751,101.557841	2000-01-01	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
589	RF	HWT2304	1051HG3675965-4	185838100720585123001	CBRA160	B_Single Site Verification for 3 layer_2 sector for Macro site Scenario	EAS0030-Full-1	\N	13.299121,100.949649	2025-04-30	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
590	RF	HWT2304	1051HG3675965-4	185838100720585124001	CBR7951	B_Single Site Verification for 3 layer_1 sector for Small cell Scenario	EAS9008-SSOA-1	\N	13.277982,100.928342	2000-01-01	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
591	RF	HWT2304	1051HG3675965-4	185838100720585125001	CCS7191	B_Single Site Verification for 4-5 layers_2 sectors for Macro site scenario	EAS9003-SSOA-1	\N	13.400702,101.638891	2025-11-07	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
592	RF	HWT2304	1051HG3675965-5	185969068876537038401	NKN7135	B_Single Site Verification for 2 layer_1 sector for Macro site Scenario	EAS9004-SSOA-1	\N	14.230671,101.044891	2000-01-01	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
593	RF	HWT2304	1051HG3675965-6	185969076607474893801	SKO7205	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS0182-SSOA-CD-1	\N	13.578341,102.023861	2025-12-03	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
594	RF	HWT2304	1051HG3675965-6	185969076607474894801	PCR7210	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS0163-Full-1	\N	13.788751,101.557841	2000-01-01	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
595	RF	HWT2604	1051HG2696155-125	185971084075212801601	WNPNM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
596	RF	HWT2604	1051HG2696155-125	185971084075212803401	NMGNM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
597	RF	HWT2604	1051HG2696155-125	185971084075212805201	CWYNM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
598	RF	HWT2604	1051HG2696155-125	185971084075212807001	NMGNM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
599	RF	HWT2604	1051HG2696155-125	185971084075212808801	WSNIM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
600	RF	HWT2304	1051HG3675965-7	185977627028396442601	NKN7179	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS9004-SSOA-1	\N	14.261311,101.284181	2025-12-08	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
601	RF	HWT2304	1051HG3675965-7	185977627028396443601	PCR7140	B_Single Site Verification for 2 layer_1 sector for Macro site Scenario	EAS0224-SSOA-CD-2	\N	13.824901,101.821601	2026-02-18	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
602	RF	HWT2304	1051HG3675965-7	185977627028396444601	PCR7160	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS0224-SSOA-CD-2	\N	13.834001,101.786371	2026-03-13	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
603	RF	HWT2304	1051HG3675965-8	185977628746384999801	RYG7299	B_Single Site Verification for 3 layer_2 sector for Macro site Scenario	EAS0143-Full-1	\N	12.827412,101.250982	2000-01-01	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
604	RF	HWT2304	1051HG3675965-8	185977628746385000801	CBR7243	B_Single Site Verification for 4-5 layers_2 sectors for Macro site scenario	EAS0091-Full-1	\N	12.706075,100.840263	2025-06-06	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
605	RF	HWT2304	1051HG3675965-8	185977628746385001801	CBRA236	B_Single Site Verification for 3 layer_2 sector for Macro site Scenario	EAS0091-Full-1	\N	12.720461,100.889751	2000-01-01	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
606	RF	HWT2304	1051HG3675965-8	185977628746385002801	RYG7957	B_Single Site Verification for 2 layer_1 sector for Macro site Scenario	EAS0077-SSOA-1	\N	12.719686,101.722537	2000-01-01	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
607	RF	HWT2304	1051HG3675965-8	185977628746385003801	SKO7137	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS0217-Full-1	\N	13.836501,102.698201	2026-01-07	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
608	RF	HWT2604	1051HG2696155-126	186019194567500596601	BSGHM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
609	RF	HWT2604	1051HG2696155-126	186019194567500598401	NCHKM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
610	RF	HWT2604	1051HG2696155-126	186019194567500600201	PKMHM	A_SSOA RF Optimization for 1 layer (normal)	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
611	RF	HWT2604	1051HG2696155-126	186019194567500602001	WNWRM	A_SSOA RF Optimization for 1 layer (normal) 1 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
612	RF	HWT2604	1051HG2696155-127	186095617497707316001	RILAM	A_SSOA RF Optimization for 1 layer (normal) 2 sector	\N	\N	\N	\N	1 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	PAC	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
613	RF	HWT2304	1051HG3675965-9	186255388563354423001	CBRA073	B_Single Site Verification for 3 layer_2 sectors for Small cell Scenario	EAS0019-SSOA-CD-1	\N	13.441761,101.009891	2026-02-20	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
614	RF	HWT2304	1051HG3675965-9	186255388563354424001	CCS7233	B_Single Site Verification for 4-5 layers_2 sectors for Macro site scenario	EAS9003-SSOA-1	\N	13.954464,101.096781	2025-05-02	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
615	RF	HWT2304	1051HG3675965-9	186255388563354425001	PCR7138	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS9005-SSOA-1	\N	14.106501,101.548701	2000-01-01	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
616	RF	HWT2304	1051HG3675965-9	186255388563354426001	CBR7959	B_Single Site Verification for 3 layer_2 sectors for Small cell Scenario	EAS0033-SSOA-CD-1	\N	13.278663,100.922541	2000-01-01	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
617	RF	HWT2304	1051HG3675965-9	186255388563354427001	CBR7954	B_Single Site Verification for 3 layer_1 sector for Small cell Scenario	EAS9008-SSOA-1	\N	13.273413,100.928466	2000-01-01	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
618	RF	HWT2304	1051HG3675965-9	186255388563354428001	CCS7209	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS0195-SSOA-CD-1	\N	13.685211,101.427731	2026-01-09	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
619	RF	HWT2304	1051HG3675965-9	186255388563354429001	CCS7190	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS9003-SSOA-1	\N	13.402891,101.618521	2025-11-07	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
620	RF	HWT2304	1051HG3675965-9	186255388563354430001	PCR7113	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS0195-SSOA-CD-1	\N	13.902833,101.456661	2025-11-24	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
621	RF	HWT2304	1051HG3675965-9	186255388563354431001	NKN7129	B_Single Site Verification for 2 layer_1 sector for Macro site Scenario	EAS9004-SSOA-1	\N	14.248891,101.048441	\N	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
622	RF	HWT2304	1051HG3675965-9	186255388563354432001	RYG7310	B_Single Site Verification for 4-5 layers_2 sectors for Small cell scenario	EAS9006-SSOA-1	\N	12.680813,100.998065	2025-10-22	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
623	RF	HWT2304	1051HG3675965-9	186255388563354433001	SKO7209	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS9007-SSOA-1	\N	13.543051,102.108851	2026-03-18	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
624	RF	HWT2304	1051HG3675965-9	186255388563354434001	CBR6834	B_Single Site Verification for 4-5 layers_2 sectors for Small cell scenario	EAS9008-SSOA-1	\N	13.423329,101.317883	2025-12-03	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
625	RF	HWT2304	1051HG3675965-9	186255388563354435001	CCS7658	B_Single Site Verification for 4-5 layers_2 sectors for Macro site scenario	EAS0195-SSOA-CD-1	\N	13.786511,101.243521	2025-12-03	4-5 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
626	RF	HWT2304	1051HG3675965-9	186255388563354436001	SKO7221	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS0216-SSOA-CD-1	\N	13.867643,102.325076	2025-12-03	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
627	RF	HWT2304	1051HG3675965-9	186255388563354437001	PCR6728	B_Single Site Verification for 2 layer_1 sector for Macro site Scenario	EAS0224-SSOA-CD-1	\N	13.739354,101.837665	2025-11-03	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
628	RF	HWT2304	1051HG3675965-9	186255388563354438001	CBR7322	B_Single Site Verification for 3 layer_2 sectors for Small cell Scenario	EAS0094-Full-CD-1	\N	12.663517,100.875457	2026-03-30	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
629	RF	HWT2304	1051HG3675965-9	186255388563354439001	NKN7155	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS9004-SSOA-1	\N	14.324799,101.038775	2025-12-16	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
630	RF	HWT2304	1051HG3675965-9	186255388563354440001	NKN7178	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS9004-SSOA-1	\N	14.269357,101.280521	2025-12-08	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
631	RF	HWT2304	1051HG3675965-9	186255388563354441001	PCR7139	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS9005-SSOA-1	\N	13.877601,101.857301	2026-02-18	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
632	RF	HWT2304	1051HG3675965-9	186255388563354442001	SKO7207	B_Single Site Verification for 2 layer_2 sector for Macro site Scenario	EAS0212-SSOA-CD-1	\N	13.468151,102.015251	2025-12-03	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
633	RF	HWT2304	1051HG3675965-9	186255388563354443001	CBR6828	B_Single Site Verification for 2 layer_2 sectors for Small cell Scenario	EAS0016-SSOA-CD-1	\N	13.450028,101.037678	2000-01-01	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
634	RF	HWT2304	1051HG3675965-9	186255388563354444001	CBR7345	B_Single Site Verification for 6-7 layers_2 sectors for Small cell scenario	EAS9008-SSOA-1	\N	13.286171,100.913891	2000-01-01	6-7 layers	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
635	RF	HWT2304	1051HG3675965-9	186255388563354445001	CBR7349	B_Single Site Verification for 2 layer_2 sectors for Small cell Scenario	EAS9008-SSOA-1	\N	13.306519,100.906877	2025-02-03	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
636	RF	HWT2304	1051HG3675965-9	186255388563354446001	PCR7128	B_Single Site Verification for 2 layer_1 sector for Macro site Scenario	EAS9005-SSOA-1	\N	14.043671,101.822933	2000-01-01	2 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
637	RF	HWT2304	1051HG3675965-9	186255388563354447001	TRT7135	B_Single Site Verification for 3 layer_2 sectors for Small cell Scenario	EAS9002-SSOA-1	\N	12.016556,102.291755	2000-01-01	3 layer	2026-05-10 17:39:57.857122+00	2026-05-10 17:39:57.857122+00	SSV	\N	PENDING_SITE_MAP	100	PO 2026.xlsx	f	PROJECT	\N	\N	\N	\N	\N	\N	\N	1	f	2026-05-10 17:39:57.857122+00	\N
\.


--
-- Data for Name: project_sites; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.project_sites (id, project_code, site_code, site_name, customer, lat, lng, gps_radius_m, province, district, is_active, created_at, updated_at) FROM stdin;
1	AIS2601	SITE-AIS-BKK-0421	Sukhumvit 21	AIS	13.7433	100.5588	500	Bangkok	Watthana	t	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00
2	AIS2601	SITE-AIS-BKK-0422	Asok BTS Area	AIS	13.7456	100.5602	300	Bangkok	Khlong Toei	t	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00
3	HWT2306	SITE-TRUE-NNT-0118	Nonthaburi Tower	TRUE	13.8591	100.5134	500	Nonthaburi	Mueang	t	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00
4	NBTC2501	SITE-AIS-RYG-0055	Rangsit Tower	AIS	14.0233	100.6177	400	Pathum Thani	Rangsit	t	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00
5	HWT2301	SITE-DTAC-BKK-0201	Silom Center	DTAC	13.7234	100.526	400	Bangkok	Bang Rak	t	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00
6	WW2503	SITE-NT-CNX-0031	Chiangmai NT Tower	NT	18.7883	98.9853	600	Chiang Mai	Mueang	t	2026-05-07 10:42:28.459166+00	2026-05-07 10:42:28.459166+00
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: ace_user
--

COPY public.system_settings (key, value, label, updated_at) FROM stdin;
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: auth_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.auth_audit_logs_id_seq', 295, true);


--
-- Name: auth_login_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.auth_login_logs_id_seq', 228, true);


--
-- Name: auth_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.auth_users_id_seq', 110, true);


--
-- Name: clock_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.clock_sessions_id_seq', 19, true);


--
-- Name: clock_sites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.clock_sites_id_seq', 6, true);


--
-- Name: email_outbox_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.email_outbox_id_seq', 42, true);


--
-- Name: employee_relocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.employee_relocations_id_seq', 1, false);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.employees_id_seq', 165, true);


--
-- Name: kpi_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.kpi_evaluations_id_seq', 1, false);


--
-- Name: kpi_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.kpi_items_id_seq', 1, false);


--
-- Name: kpi_period_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.kpi_period_items_id_seq', 1, false);


--
-- Name: leave_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.leave_requests_id_seq', 1, false);


--
-- Name: project_assignments_live_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.project_assignments_live_id_seq', 75, true);


--
-- Name: project_catalog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.project_catalog_id_seq', 16, true);


--
-- Name: project_pos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.project_pos_id_seq', 637, true);


--
-- Name: project_sites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ace_user
--

SELECT pg_catalog.setval('public.project_sites_id_seq', 6, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_audit_logs auth_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.auth_audit_logs
    ADD CONSTRAINT auth_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_login_logs auth_login_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.auth_login_logs
    ADD CONSTRAINT auth_login_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_users auth_users_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_pkey PRIMARY KEY (id);


--
-- Name: clock_sessions clock_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.clock_sessions
    ADD CONSTRAINT clock_sessions_pkey PRIMARY KEY (id);


--
-- Name: clock_sites clock_sites_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.clock_sites
    ADD CONSTRAINT clock_sites_pkey PRIMARY KEY (id);


--
-- Name: email_outbox email_outbox_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.email_outbox
    ADD CONSTRAINT email_outbox_pkey PRIMARY KEY (id);


--
-- Name: employee_relocations employee_relocations_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.employee_relocations
    ADD CONSTRAINT employee_relocations_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: kpi_evaluations kpi_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.kpi_evaluations
    ADD CONSTRAINT kpi_evaluations_pkey PRIMARY KEY (id);


--
-- Name: kpi_items kpi_items_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.kpi_items
    ADD CONSTRAINT kpi_items_pkey PRIMARY KEY (id);


--
-- Name: kpi_period_items kpi_period_items_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.kpi_period_items
    ADD CONSTRAINT kpi_period_items_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: project_assignments_live project_assignments_live_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.project_assignments_live
    ADD CONSTRAINT project_assignments_live_pkey PRIMARY KEY (id);


--
-- Name: project_catalog project_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.project_catalog
    ADD CONSTRAINT project_catalog_pkey PRIMARY KEY (id);


--
-- Name: project_pos project_pos_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.project_pos
    ADD CONSTRAINT project_pos_pkey PRIMARY KEY (id);


--
-- Name: project_sites project_sites_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.project_sites
    ADD CONSTRAINT project_sites_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- Name: kpi_evaluations uq_kpi_eval_emp_period_item; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.kpi_evaluations
    ADD CONSTRAINT uq_kpi_eval_emp_period_item UNIQUE (employee_name, period, item_id);


--
-- Name: kpi_items uq_kpi_item_id; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.kpi_items
    ADD CONSTRAINT uq_kpi_item_id UNIQUE (item_id);


--
-- Name: kpi_period_items uq_kpi_period_emp_item; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.kpi_period_items
    ADD CONSTRAINT uq_kpi_period_emp_item UNIQUE (period, employee_name, item_id);


--
-- Name: project_assignments_live uq_live_project_assignment; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.project_assignments_live
    ADD CONSTRAINT uq_live_project_assignment UNIQUE (project_code, employee_code, role_in_project);


--
-- Name: project_catalog uq_project_catalog_code; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.project_catalog
    ADD CONSTRAINT uq_project_catalog_code UNIQUE (project_code);


--
-- Name: project_sites uq_project_site_code; Type: CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.project_sites
    ADD CONSTRAINT uq_project_site_code UNIQUE (site_code);


--
-- Name: ix_audit_logs_action; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: ix_audit_logs_changed_by_user_id; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_audit_logs_changed_by_user_id ON public.audit_logs USING btree (changed_by_user_id);


--
-- Name: ix_audit_logs_created_at; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: ix_audit_logs_employee_id; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_audit_logs_employee_id ON public.audit_logs USING btree (employee_id);


--
-- Name: ix_audit_logs_entity_id; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_audit_logs_entity_id ON public.audit_logs USING btree (entity_id);


--
-- Name: ix_audit_logs_entity_type; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_audit_logs_entity_type ON public.audit_logs USING btree (entity_type);


--
-- Name: ix_audit_logs_ip_address; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_audit_logs_ip_address ON public.audit_logs USING btree (ip_address);


--
-- Name: ix_auth_audit_logs_action; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_auth_audit_logs_action ON public.auth_audit_logs USING btree (action);


--
-- Name: ix_auth_audit_logs_employee_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_auth_audit_logs_employee_code ON public.auth_audit_logs USING btree (employee_code);


--
-- Name: ix_auth_login_logs_created_at; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_auth_login_logs_created_at ON public.auth_login_logs USING btree (created_at);


--
-- Name: ix_auth_login_logs_employee_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_auth_login_logs_employee_code ON public.auth_login_logs USING btree (employee_code);


--
-- Name: ix_auth_login_logs_identifier; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_auth_login_logs_identifier ON public.auth_login_logs USING btree (identifier);


--
-- Name: ix_auth_login_logs_ip_address; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_auth_login_logs_ip_address ON public.auth_login_logs USING btree (ip_address);


--
-- Name: ix_auth_login_logs_success; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_auth_login_logs_success ON public.auth_login_logs USING btree (success);


--
-- Name: ix_auth_users_employee_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE UNIQUE INDEX ix_auth_users_employee_code ON public.auth_users USING btree (employee_code);


--
-- Name: ix_auth_users_role; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_auth_users_role ON public.auth_users USING btree (role);


--
-- Name: ix_clock_sessions_employee_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_clock_sessions_employee_code ON public.clock_sessions USING btree (employee_code);


--
-- Name: ix_clock_sessions_user_id; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_clock_sessions_user_id ON public.clock_sessions USING btree (user_id);


--
-- Name: ix_clock_sessions_work_date; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_clock_sessions_work_date ON public.clock_sessions USING btree (work_date);


--
-- Name: ix_clock_sites_project_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_clock_sites_project_code ON public.clock_sites USING btree (project_code);


--
-- Name: ix_clock_sites_site_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE UNIQUE INDEX ix_clock_sites_site_code ON public.clock_sites USING btree (site_code);


--
-- Name: ix_email_outbox_recipient; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_email_outbox_recipient ON public.email_outbox USING btree (recipient);


--
-- Name: ix_email_outbox_status; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_email_outbox_status ON public.email_outbox USING btree (status);


--
-- Name: ix_employee_relocations_effective_date; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employee_relocations_effective_date ON public.employee_relocations USING btree (effective_date);


--
-- Name: ix_employee_relocations_employee_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employee_relocations_employee_code ON public.employee_relocations USING btree (employee_code);


--
-- Name: ix_employee_relocations_from_project_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employee_relocations_from_project_code ON public.employee_relocations USING btree (from_project_code);


--
-- Name: ix_employee_relocations_to_project_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employee_relocations_to_project_code ON public.employee_relocations USING btree (to_project_code);


--
-- Name: ix_employees_department; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employees_department ON public.employees USING btree (department);


--
-- Name: ix_employees_email; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employees_email ON public.employees USING btree (email);


--
-- Name: ix_employees_employee_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE UNIQUE INDEX ix_employees_employee_code ON public.employees USING btree (employee_code);


--
-- Name: ix_employees_first_name; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employees_first_name ON public.employees USING btree (first_name);


--
-- Name: ix_employees_full_name; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employees_full_name ON public.employees USING btree (full_name);


--
-- Name: ix_employees_last_name; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employees_last_name ON public.employees USING btree (last_name);


--
-- Name: ix_employees_manager_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employees_manager_code ON public.employees USING btree (manager_code);


--
-- Name: ix_employees_project_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employees_project_code ON public.employees USING btree (project_code);


--
-- Name: ix_employees_project_team; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employees_project_team ON public.employees USING btree (project_team);


--
-- Name: ix_employees_status; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_employees_status ON public.employees USING btree (status);


--
-- Name: ix_kpi_evaluations_employee_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_kpi_evaluations_employee_code ON public.kpi_evaluations USING btree (employee_code);


--
-- Name: ix_kpi_evaluations_employee_name; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_kpi_evaluations_employee_name ON public.kpi_evaluations USING btree (employee_name);


--
-- Name: ix_kpi_evaluations_eval_id; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_kpi_evaluations_eval_id ON public.kpi_evaluations USING btree (eval_id);


--
-- Name: ix_kpi_evaluations_item_id; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_kpi_evaluations_item_id ON public.kpi_evaluations USING btree (item_id);


--
-- Name: ix_kpi_evaluations_period; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_kpi_evaluations_period ON public.kpi_evaluations USING btree (period);


--
-- Name: ix_kpi_items_item_id; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_kpi_items_item_id ON public.kpi_items USING btree (item_id);


--
-- Name: ix_kpi_items_position; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_kpi_items_position ON public.kpi_items USING btree ("position");


--
-- Name: ix_kpi_period_items_employee_name; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_kpi_period_items_employee_name ON public.kpi_period_items USING btree (employee_name);


--
-- Name: ix_kpi_period_items_item_id; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_kpi_period_items_item_id ON public.kpi_period_items USING btree (item_id);


--
-- Name: ix_kpi_period_items_period; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_kpi_period_items_period ON public.kpi_period_items USING btree (period);


--
-- Name: ix_leave_requests_employee_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_leave_requests_employee_code ON public.leave_requests USING btree (employee_code);


--
-- Name: ix_leave_requests_start_date; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_leave_requests_start_date ON public.leave_requests USING btree (start_date);


--
-- Name: ix_leave_requests_status; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_leave_requests_status ON public.leave_requests USING btree (status);


--
-- Name: ix_project_assignments_live_employee_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_assignments_live_employee_code ON public.project_assignments_live USING btree (employee_code);


--
-- Name: ix_project_assignments_live_is_active; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_assignments_live_is_active ON public.project_assignments_live USING btree (is_active);


--
-- Name: ix_project_assignments_live_project_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_assignments_live_project_code ON public.project_assignments_live USING btree (project_code);


--
-- Name: ix_project_assignments_live_role_in_project; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_assignments_live_role_in_project ON public.project_assignments_live USING btree (role_in_project);


--
-- Name: ix_project_catalog_project_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_catalog_project_code ON public.project_catalog USING btree (project_code);


--
-- Name: ix_project_catalog_team; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_catalog_team ON public.project_catalog USING btree (team);


--
-- Name: ix_project_pos_current_owner_role; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_pos_current_owner_role ON public.project_pos USING btree (current_owner_role);


--
-- Name: ix_project_pos_locked; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_pos_locked ON public.project_pos USING btree (locked);


--
-- Name: ix_project_pos_need_mapping_review; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_pos_need_mapping_review ON public.project_pos USING btree (need_mapping_review);


--
-- Name: ix_project_pos_po_number; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_pos_po_number ON public.project_pos USING btree (po_number);


--
-- Name: ix_project_pos_po_target; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_pos_po_target ON public.project_pos USING btree (po_target);


--
-- Name: ix_project_pos_project_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_pos_project_code ON public.project_pos USING btree (project_code);


--
-- Name: ix_project_pos_site_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_pos_site_code ON public.project_pos USING btree (site_code);


--
-- Name: ix_project_pos_work_type; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_pos_work_type ON public.project_pos USING btree (work_type);


--
-- Name: ix_project_pos_workflow_status; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_pos_workflow_status ON public.project_pos USING btree (workflow_status);


--
-- Name: ix_project_sites_customer; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_sites_customer ON public.project_sites USING btree (customer);


--
-- Name: ix_project_sites_is_active; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_sites_is_active ON public.project_sites USING btree (is_active);


--
-- Name: ix_project_sites_project_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_sites_project_code ON public.project_sites USING btree (project_code);


--
-- Name: ix_project_sites_site_code; Type: INDEX; Schema: public; Owner: ace_user
--

CREATE INDEX ix_project_sites_site_code ON public.project_sites USING btree (site_code);


--
-- Name: clock_sessions clock_sessions_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ace_user
--

ALTER TABLE ONLY public.clock_sessions
    ADD CONSTRAINT clock_sessions_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.clock_sites(id);


--
-- PostgreSQL database dump complete
--

\unrestrict NlazfTt5LLev5U8OVXSbtK61JvsFKl6Je1cgeesRG6ewXLTa6yhHtUZSp2hfaHR

