import { Controller, Get, Req, Res, Query } from '@nestjs/common'
import { AuthenticationService } from './authentication.service'
import { config } from '../app.module'

@Controller()
export class AuthenticationController {

    public constructor(private readonly authenticationService: AuthenticationService) { }

    @Get('/authentication/login')
    login(@Req() req: any, @Res() res: any, @Query('action') action: string): void {
        this.authenticationService.keepTheAction(action, req.connection.remoteAddress)
        res.redirect(this.authenticationService.getOAUTHLoginURL(this.authenticationService.addState()))
    }

    @Get('/authentication/github/callback')
    public async handleCallback(@Req() req: any, @Res() res: any): Promise<any> {
        const authenticationData = await this.authenticationService.createAuthenticationDataFromCode(req.query.code, req.query.state)
        const redirectURL = `${config.frontendURL}?actionID=${this.authenticationService.getActionForAddress(req.connection.remoteAddress)}&login=${authenticationData.login}&authenticationToken=${authenticationData.token}`
        res.redirect(redirectURL)
    }

    @Get('/login/oauth/authorize') // this route is only needed for test purposes - test doubling an oauth provider - if you have an idea how to do this better create a PR
    authorize(@Req() req: any, @Res() res: any, @Query('state') state: string): void {
        res.redirect(`${config.backendURL}/authentication/github/callback?state=${state}`)
    }

}
