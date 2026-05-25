import { NextRequest, NextResponse } from 'next/server'
import { createDb } from '@/db'
import { respondents, responses } from '@/db/schema'

interface SubmitBody {
  name: string
  career: string
  universityName: string
  universityType: string
  yearStage: string
  b2_q1: string
  b2_q2: string
  b2_q3: string
  b3_q1: string
  b3_q2: string
  b3_q3: string
  b4_q1: string
  b4_q2: string
  b4_q3: string
  b4_q4: string
  b5_q1: string
  b5_q2: string
}

const QUESTION_KEYS = [
  'b2_q1', 'b2_q2', 'b2_q3',
  'b3_q1', 'b3_q2', 'b3_q3',
  'b4_q1', 'b4_q2', 'b4_q3', 'b4_q4',
  'b5_q1', 'b5_q2',
] as const

export async function POST(req: NextRequest) {
  try {
    const body: SubmitBody = await req.json()

    const { name, career, universityName, universityType, yearStage } = body

    if (!name?.trim() || !career?.trim() || !universityName?.trim() || !universityType || !yearStage?.trim()) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    const db = createDb()

    const [respondent] = await db
      .insert(respondents)
      .values({
        name: name.trim(),
        careerRaw: career.trim(),
        universityName: universityName.trim(),
        universityType,
        yearStage: yearStage.trim(),
      })
      .returning({ id: respondents.id })

    const answeredKeys = QUESTION_KEYS.filter(
      (key) => body[key]?.trim()
    )

    if (answeredKeys.length > 0) {
      await db.insert(responses).values(
        answeredKeys.map((key) => ({
          respondentId: respondent.id,
          questionKey: key,
          rawAnswer: body[key].trim(),
        }))
      )
    }

    return NextResponse.json({ success: true, id: respondent.id })
  } catch (error) {
    console.error('[submit]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
