from ..models import Subject, AcademicYear, Semester

def get_subjects(filters):
    query = Subject.query.join(AcademicYear).join(Semester)

    if filters.get('semester'):
        query = query.filter(Semester.number == int(filters.get('semester')))
        
    if filters.get('academicYear'):
        query = query.filter(AcademicYear.label == filters.get('academicYear'))

    return query.all()
