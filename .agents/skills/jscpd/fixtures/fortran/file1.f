      PROGRAM MATHUTILS
C     Common math utility subroutines
      IMPLICIT NONE

      SUBROUTINE COMPUTE_STATS(ARR, N, MEAN, STDDEV)
      INTEGER N
      REAL ARR(N), MEAN, STDDEV
      REAL SUM, SUMSQ
      INTEGER I
      SUM = 0.0
      SUMSQ = 0.0
      DO I = 1, N
          SUM = SUM + ARR(I)
          SUMSQ = SUMSQ + ARR(I) * ARR(I)
      END DO
      MEAN = SUM / N
      STDDEV = SQRT(SUMSQ / N - MEAN * MEAN)
      RETURN
      END

      SUBROUTINE SORT_ARRAY(ARR, N)
      INTEGER N
      REAL ARR(N), TEMP
      INTEGER I, J
      DO I = 1, N - 1
          DO J = 1, N - I
              IF (ARR(J) .GT. ARR(J+1)) THEN
                  TEMP = ARR(J)
                  ARR(J) = ARR(J+1)
                  ARR(J+1) = TEMP
              END IF
          END DO
      END DO
      RETURN
      END

C     File-specific: print array
      SUBROUTINE PRINT_ARRAY(ARR, N)
      INTEGER N, I
      REAL ARR(N)
      DO I = 1, N
          WRITE(*,*) 'ARR(', I, ') =', ARR(I)
      END DO
      RETURN
      END
      END PROGRAM MATHUTILS
