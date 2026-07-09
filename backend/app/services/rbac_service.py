import uuid
from datetime import datetime
from ..models import User, FacultyAssignment, SystemSetting

def to_uuid(val):
    if not val:
        return None
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except ValueError:
        return None

def get_settings():
    """Retrieves all active system settings as a dictionary."""
    settings_dict = {}
    try:
        all_settings = SystemSetting.query.all()
        for s in all_settings:
            settings_dict[s.key] = s.value
    except Exception as e:
        print(f"Error fetching system settings: {e}")
    return settings_dict

def get_user_effective_roles(user_id, subject_id=None, department=None):
    """
    Returns a set of active roles (system + contextual) for a user.
    """
    u_uuid = to_uuid(user_id)
    if not u_uuid:
        return set()

    user = User.query.get(u_uuid)
    if not user:
        return set()

    # System roles: SUPER_ADMIN, ADMIN, ACADEMIC. Treat legacy FACULTY and STAFF as ACADEMIC.
    system_role = user.role
    if system_role in ['FACULTY', 'STAFF']:
        system_role = 'ACADEMIC'
    roles = {system_role}
    
    # Super Admin and Admin possess all sub-roles globally
    if system_role in ['SUPER_ADMIN', 'ADMIN']:
        roles.update(['FACULTY', 'SUBJECT_EXPERT', 'HOD', 'COE', 'STAFF'])
        return roles

    # Query active contextual assignments
    now = datetime.utcnow()
    query = FacultyAssignment.query.filter(
        FacultyAssignment.user_id == u_uuid,
        FacultyAssignment.is_active == True,
        FacultyAssignment.valid_from <= now,
        FacultyAssignment.valid_until >= now
    )

    if subject_id:
        s_uuid = to_uuid(subject_id)
        if s_uuid:
            # Check assignments either specific to this subject, or department-wide
            if department:
                query = query.filter(
                    (FacultyAssignment.subject_id == s_uuid) | 
                    (FacultyAssignment.department == department)
                )
            else:
                query = query.filter(FacultyAssignment.subject_id == s_uuid)
    elif department:
        query = query.filter(FacultyAssignment.department == department)

    assignments = query.all()
    for assign in assignments:
        roles.add(assign.role_type)
        
    return roles

def has_subject_permission(user_id, subject_id, required_roles: list) -> bool:
    """
    Checks if the user has at least one of the required roles (system or contextual) for the subject.
    """
    u_uuid = to_uuid(user_id)
    if not u_uuid:
        return False

    user = User.query.get(u_uuid)
    if not user:
        return False
        
    if user.role in ['SUPER_ADMIN', 'ADMIN']:
        return True

    s_uuid = to_uuid(subject_id)
    effective_roles = get_user_effective_roles(u_uuid, subject_id=s_uuid)
    has_perm = any(role in effective_roles for role in required_roles)
    
    if has_perm:
        return True
        
    # Legacy fallback removed for security: only context assignments govern permissions
    pass
            
    return False

def has_department_permission(user_id, department, required_roles: list) -> bool:
    """
    Checks if the user has at least one of the required roles (system or contextual) for the department.
    """
    u_uuid = to_uuid(user_id)
    if not u_uuid:
        return False

    user = User.query.get(u_uuid)
    if not user:
        return False
        
    if user.role in ['SUPER_ADMIN', 'ADMIN']:
        return True

    effective_roles = get_user_effective_roles(u_uuid, department=department)
    return any(role in effective_roles for role in required_roles)
