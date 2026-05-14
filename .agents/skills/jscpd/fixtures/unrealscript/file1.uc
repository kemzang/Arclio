// Unreal Engine 3 UnrealScript - Character Controller
class MyCharacter extends GamePawn
  placeable;

var float WalkSpeed;
var float RunSpeed;
var float JumpHeight;
var bool bIsRunning;
var bool bIsCrouching;

var SoundCue FootstepSound;
var SoundCue JumpSound;
var SoundCue LandSound;

var ParticleSystemComponent DustEffect;

simulated event PostBeginPlay()
{
  Super.PostBeginPlay();
  WalkSpeed  = 300.0f;
  RunSpeed   = 600.0f;
  JumpHeight = 420.0f;
  bIsRunning   = false;
  bIsCrouching = false;
  GroundSpeed  = WalkSpeed;
}

simulated function SetRunning(bool bRun)
{
  bIsRunning = bRun;
  if (bIsRunning)
  {
    GroundSpeed = RunSpeed;
  }
  else
  {
    GroundSpeed = WalkSpeed;
  }
}

simulated function SetCrouching(bool bCrouch)
{
  bIsCrouching = bCrouch;
  if (bIsCrouching)
  {
    GroundSpeed = WalkSpeed * 0.5f;
    ShouldCrouch(true);
  }
  else
  {
    GroundSpeed = bIsRunning ? RunSpeed : WalkSpeed;
    ShouldCrouch(false);
  }
}

event Landed(vector HitNormal, Actor FloorActor)
{
  Super.Landed(HitNormal, FloorActor);
  if (LandSound != None)
  {
    PlaySound(LandSound);
  }
  if (DustEffect != None && VSize(Velocity) > 200.0f)
  {
    DustEffect.ActivateSystem();
  }
}

function bool DoJump(bool bUpdating)
{
  if (Super.DoJump(bUpdating))
  {
    if (JumpSound != None)
    {
      PlaySound(JumpSound);
    }
    return true;
  }
  return false;
}

defaultproperties
{
  WalkSpeed  = 300.0
  RunSpeed   = 600.0
  JumpHeight = 420.0
  bCanCrouch = true
  bCanJump   = true
}
